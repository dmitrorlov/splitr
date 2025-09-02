package command

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/dmitrorlov/splitr/backend/entity"
	mock_usecase "github.com/dmitrorlov/splitr/backend/mocks/usecase"
	"github.com/dmitrorlov/splitr/backend/pkg/errs"
)

func TestNewExecutor(t *testing.T) {
	executor := NewExecutor()

	assert.NotNil(t, executor)
	assert.NotNil(t, executor.outputParser)
	assert.NotNil(t, executor.cmdRunner)
	assert.IsType(t, &defaultCommandRunner{}, executor.cmdRunner)

	expectedArgs := []string{"--nc", "list"}
	assert.Equal(t, expectedArgs, executor.cmdListVPNArgs)

	expectedDefaultInterfaceArgs := []string{"get", "default"}
	assert.Equal(t, expectedDefaultInterfaceArgs, executor.cmdGetDefaultInterfaceArgs)
}

func TestNewExecutorWithRunner(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
	executor := NewExecutorWithRunner(mockRunner)

	assert.NotNil(t, executor)
	assert.NotNil(t, executor.outputParser)
	assert.Equal(t, mockRunner, executor.cmdRunner)
}

func TestDefaultCommandRunner_Run(t *testing.T) {
	runner := &defaultCommandRunner{}
	ctx := context.Background()

	output, err := runner.Run(ctx, "echo", "test")

	require.NoError(t, err)
	assert.Contains(t, output, "test")
}

func TestExecutor_GetDefaultNetworkInterface(t *testing.T) {
	tests := []struct {
		name           string
		commandOutput  []string
		commandError   error
		expectedResult entity.NetworkInterface
		expectedError  string
	}{
		{
			name: "successful parsing with valid output",
			commandOutput: []string{
				"default 192.168.1.1 UGSc 12 0 en0",
				"interface wlan0",
				"default 192.168.1.1 UGSc 12 0 wlan0",
			},
			expectedResult: "wlan0",
		},
		{
			name: "successful parsing with multiple interfaces",
			commandOutput: []string{
				"default 10.0.0.1 UGSc 5 0 eth0",
				"interface eth0",
				"10.0.0.0/8 10.0.0.1 UGSc 3 0 eth0",
			},
			expectedResult: "eth0",
		},
		{
			name: "parsing with spaces around interface line",
			commandOutput: []string{
				"some output",
				"interface wlan0",
			},
			expectedResult: "wlan0",
		},
		{
			name:          "command execution error",
			commandOutput: nil,
			commandError:  errors.New("route command failed"),
			expectedError: "failed to sync execute command: route command failed",
		},
		{
			name: "no interface found in output",
			commandOutput: []string{
				"default host gateway: 192.168.1.1",
				"some random output",
			},
			expectedError: "failed to find network interface in command output",
		},
		{
			name: "malformed interface line - single word",
			commandOutput: []string{
				"some output",
				"interface",
				"more output",
			},
			expectedError: "failed to find network interface in command output",
		},
		{
			name:          "empty output",
			commandOutput: []string{},
			expectedError: "failed to find network interface in command output",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			mockRunner.EXPECT().
				Run(ctx, cmdRoute, "get", "default").
				Return(tt.commandOutput, tt.commandError).
				Times(1)

			result, err := executor.GetDefaultNetworkInterface(ctx)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Empty(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestExecutor_GetNetworkServiceByNetworkInterface(t *testing.T) {
	tests := []struct {
		name             string
		networkInterface entity.NetworkInterface
		commandOutput    []string
		commandError     error
		expectedResult   entity.NetworkService
		expectedError    string
	}{
		{
			name:             "successful parsing with Wi-Fi",
			networkInterface: "en0",
			commandOutput: []string{
				"An asterisk (*) denotes that a network service is disabled.",
				"(1) Ethernet",
				"(Hardware Port: Ethernet, Device: en1)",
				"",
				"(2) Wi-Fi",
				"(Hardware Port: Wi-Fi, Device: en0)",
				"",
				"(3) Bluetooth PAN",
				"(Hardware Port: Bluetooth PAN, Device: en2)",
			},
			expectedResult: "Wi-Fi",
		},
		{
			name:             "successful parsing with Ethernet",
			networkInterface: "en1",
			commandOutput: []string{
				"(1) Ethernet",
				"(Hardware Port: Ethernet, Device: en1)",
				"",
				"(2) Wi-Fi",
				"(Hardware Port: Wi-Fi, Device: en0)",
			},
			expectedResult: "Ethernet",
		},
		{
			name:             "interface not found",
			networkInterface: "en5",
			commandOutput: []string{
				"(1) Ethernet",
				"(Hardware Port: Ethernet, Device: en1)",
				"",
				"(2) Wi-Fi",
				"(Hardware Port: Wi-Fi, Device: en0)",
			},
			expectedError: "failed to find network service by interface en5",
		},
		{
			name:             "command execution error",
			networkInterface: "en0",
			commandOutput:    nil,
			commandError:     errors.New("networksetup command failed"),
			expectedError:    "failed to sync execute command: networksetup command failed",
		},
		{
			name:             "malformed output - missing device line",
			networkInterface: "en0",
			commandOutput: []string{
				"(1) Wi-Fi",
			},
			expectedError: "failed to find network service by interface en0",
		},
		{
			name:             "malformed output - empty service name",
			networkInterface: "en0",
			commandOutput: []string{
				"",
				"(Hardware Port: Wi-Fi, Device: en0)",
			},
			expectedError: "failed to find network service by interface en0",
		},
		{
			name:             "malformed output - unparseable service name",
			networkInterface: "en0",
			commandOutput: []string{
				"Wi-Fi Service",
				"(Hardware Port: Wi-Fi, Device: en0)",
			},
			expectedError: "failed to find network service by interface en0",
		},
		{
			name:             "malformed output - unparseable interface name",
			networkInterface: "en0",
			commandOutput: []string{
				"(1) Wi-Fi",
				"Unparseable interface line with en0",
			},
			expectedError: "failed to find network service by interface en0",
		},
		{
			name:             "empty output",
			networkInterface: "en0",
			commandOutput:    []string{},
			expectedError:    "failed to find network service by interface en0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			mockRunner.EXPECT().
				Run(ctx, cmdNetworkSetup, "-listnetworkserviceorder").
				Return(tt.commandOutput, tt.commandError).
				Times(1)

			result, err := executor.GetNetworkServiceByNetworkInterface(ctx, tt.networkInterface)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Empty(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestExecutor_GetNetworkInfoByNetworkService(t *testing.T) {
	tests := []struct {
		name           string
		networkService entity.NetworkService
		commandOutput  []string
		commandError   error
		expectedResult *entity.NetworkInfo
		expectedError  string
	}{
		{
			name:           "successful parsing with complete network info",
			networkService: "Wi-Fi",
			commandOutput: []string{
				"DHCP Configuration",
				"IP address: 192.168.1.100",
				"Subnet mask: 255.255.255.0",
				"Router: 192.168.1.1",
				"Client ID: ",
				"IPv6: Automatic",
			},
			expectedResult: &entity.NetworkInfo{
				SubnetMask: "255.255.255.0",
				Router:     "192.168.1.1",
			},
		},
		{
			name:           "successful parsing with different IP ranges",
			networkService: "Ethernet",
			commandOutput: []string{
				"DHCP Configuration",
				"IP address: 10.0.0.50",
				"Subnet mask: 255.255.0.0",
				"Router: 10.0.0.1",
			},
			expectedResult: &entity.NetworkInfo{
				SubnetMask: "255.255.0.0",
				Router:     "10.0.0.1",
			},
		},
		{
			name:           "command execution error",
			networkService: "Wi-Fi",
			commandOutput:  nil,
			commandError:   errors.New("networksetup getinfo failed"),
			expectedError:  "failed to sync execute command: networksetup getinfo failed",
		},
		{
			name:           "missing subnet mask",
			networkService: "Wi-Fi",
			commandOutput: []string{
				"DHCP Configuration",
				"IP address: 192.168.1.100",
				"Router: 192.168.1.1",
			},
			expectedError: "failed to find network info in command output",
		},
		{
			name:           "missing router",
			networkService: "Wi-Fi",
			commandOutput: []string{
				"DHCP Configuration",
				"IP address: 192.168.1.100",
				"Subnet mask: 255.255.255.0",
			},
			expectedError: "failed to find network info in command output",
		},
		{
			name:           "empty output",
			networkService: "Wi-Fi",
			commandOutput:  []string{},
			expectedError:  "failed to find network info in command output",
		},
		{
			name:           "malformed network info",
			networkService: "Wi-Fi",
			commandOutput: []string{
				"Some random output",
				"Not network info",
			},
			expectedError: "failed to find network info in command output",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			mockRunner.EXPECT().
				Run(ctx, cmdNetworkSetup, "-getinfo", string(tt.networkService)).
				Return(tt.commandOutput, tt.commandError).
				Times(1)

			result, err := executor.GetNetworkInfoByNetworkService(ctx, tt.networkService)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestExecutor_SetNetworkAdditionalRoutes(t *testing.T) {
	tests := []struct {
		name                 string
		network              *entity.Network
		networkHostSetupList []*entity.NetworkHostSetup
		commandError         error
		expectedError        string
		expectedCommandArgs  []string
	}{
		{
			name:    "successful route setting with single host",
			network: &entity.Network{Name: "Wi-Fi"},
			networkHostSetupList: []*entity.NetworkHostSetup{
				{
					NetworkHostIP: "10.0.0.100",
					SubnetMask:    "255.255.255.0",
					Router:        "10.0.0.1",
				},
			},
			expectedCommandArgs: []string{
				"-setadditionalroutes",
				"Wi-Fi",
				"10.0.0.100",
				"255.255.255.0",
				"10.0.0.1",
			},
		},
		{
			name:    "successful route setting with multiple hosts",
			network: &entity.Network{Name: "Ethernet"},
			networkHostSetupList: []*entity.NetworkHostSetup{
				{
					NetworkHostIP: "192.168.1.100",
					SubnetMask:    "255.255.255.0",
					Router:        "192.168.1.1",
				},
				{
					NetworkHostIP: "10.10.0.100",
					SubnetMask:    "255.255.0.0",
					Router:        "10.10.0.1",
				},
			},
			expectedCommandArgs: []string{
				"-setadditionalroutes",
				"Ethernet",
				"192.168.1.100",
				"255.255.255.0",
				"192.168.1.1",
				"10.10.0.100",
				"255.255.0.0",
				"10.10.0.1",
			},
		},
		{
			name:                 "empty network host setup list",
			network:              &entity.Network{Name: "Wi-Fi"},
			networkHostSetupList: []*entity.NetworkHostSetup{},
			expectedCommandArgs:  []string{"-setadditionalroutes", "Wi-Fi"},
		},
		{
			name:    "command execution error",
			network: &entity.Network{Name: "Wi-Fi"},
			networkHostSetupList: []*entity.NetworkHostSetup{
				{
					NetworkHostIP: "10.0.0.100",
					SubnetMask:    "255.255.255.0",
					Router:        "10.0.0.1",
				},
			},
			commandError:  errors.New("networksetup setadditionalroutes failed"),
			expectedError: "failed to sync execute command: networksetup setadditionalroutes failed",
			expectedCommandArgs: []string{
				"-setadditionalroutes",
				"Wi-Fi",
				"10.0.0.100",
				"255.255.255.0",
				"10.0.0.1",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			// The args are verified in the DoAndReturn function below

			mockRunner.EXPECT().
				Run(gomock.Any(), gomock.Eq(cmdNetworkSetup), gomock.Any()).
				DoAndReturn(func(_ context.Context, _ string, args ...string) ([]string, error) {
					// Verify all expected args are present
					for _, expectedArg := range tt.expectedCommandArgs {
						assert.Contains(t, args, expectedArg)
					}
					return []string{}, tt.commandError
				}).
				Times(1)

			err := executor.SetNetworkAdditionalRoutes(ctx, tt.network, tt.networkHostSetupList)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestExecutor_ListVPN(t *testing.T) {
	tests := []struct {
		name           string
		commandOutput  []string
		commandError   error
		expectedResult []entity.VPNService
		expectedError  string
	}{
		{
			name: "successful parsing with multiple VPNs",
			commandOutput: []string{
				"<dictionary>",
				"  <key>PPP</key>",
				"  <dictionary>",
				"    <key>SubType</key>",
				"    <string>PPTP</string>",
				"    <key>L2TP</key>",
				"  </dictionary>",
				"</dictionary>",
				"  \"VPN-Connection-1\" [PPP:L2TP]",
				"  \"Corporate-VPN\" [PPP:L2TP] 10.0.0.1",
				"  \"Home-Office\" [PPP:L2TP] (Connected)",
			},
			expectedResult: []entity.VPNService{"VPN-Connection-1", "Corporate-VPN", "Home-Office"},
		},
		{
			name: "successful parsing with single VPN",
			commandOutput: []string{
				"  \"My-VPN\" [PPP:L2TP]",
			},
			expectedResult: []entity.VPNService{"My-VPN"},
		},
		{
			name: "no VPNs found",
			commandOutput: []string{
				"<dictionary>",
				"  <key>State</key>",
				"  <string>Disconnected</string>",
				"</dictionary>",
			},
			expectedResult: []entity.VPNService{},
		},
		{
			name: "VPN line without parseable name",
			commandOutput: []string{
				"[PPP:L2TP] invalid format",
			},
			expectedResult: []entity.VPNService{},
		},
		{
			name:          "command execution error",
			commandOutput: nil,
			commandError:  errors.New("scutil command failed"),
			expectedError: "failed to sync execute command: scutil command failed",
		},
		{
			name:           "empty output",
			commandOutput:  []string{},
			expectedResult: []entity.VPNService{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			mockRunner.EXPECT().
				Run(ctx, cmdSCUtil, "--nc", "list").
				Return(tt.commandOutput, tt.commandError).
				Times(1)

			result, err := executor.ListVPN(ctx)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestExecutor_GetCurrentVPN(t *testing.T) {
	tests := []struct {
		name           string
		commandOutput  []string
		commandError   error
		expectedResult entity.VPNService
		expectedError  error
	}{
		{
			name: "successful parsing with connected VPN",
			commandOutput: []string{
				"  \"VPN-Connection-1\" [PPP:L2TP] 10.0.0.1 (Connecting)",
				"  \"Corporate-VPN\" [PPP:L2TP] 192.168.1.1 (Connected)",
				"  \"Home-Office\" [PPP:L2TP] 172.16.0.1 (Disconnected)",
			},
			expectedResult: "Corporate-VPN",
		},
		{
			name: "successful parsing with single connected VPN",
			commandOutput: []string{
				"  \"My-Work-VPN\" [PPP:L2TP] (Connected)",
			},
			expectedResult: "My-Work-VPN",
		},
		{
			name: "no connected VPN found",
			commandOutput: []string{
				"  \"VPN-Connection-1\" [PPP:L2TP] (Disconnected)",
				"  \"Corporate-VPN\" [PPP:L2TP] (Disconnected)",
			},
			expectedError: errs.ErrVPNServiceNotFound,
		},
		{
			name: "VPN exists but not L2TP type",
			commandOutput: []string{
				"  \"PPTP-VPN\" [PPP:PPTP] (Connected)",
			},
			expectedError: errs.ErrVPNServiceNotFound,
		},
		{
			name: "connected VPN with unparseable name",
			commandOutput: []string{
				"[PPP:L2TP] (Connected) malformed",
			},
			expectedError: errs.ErrVPNServiceNotFound,
		},
		{
			name:          "command execution error",
			commandOutput: nil,
			commandError:  errors.New("scutil command failed"),
			expectedError: errors.New("failed to sync execute command: scutil command failed"),
		},
		{
			name:          "empty output",
			commandOutput: []string{},
			expectedError: errs.ErrVPNServiceNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			mockRunner.EXPECT().
				Run(ctx, cmdSCUtil, "--nc", "list").
				Return(tt.commandOutput, tt.commandError).
				Times(1)

			result, err := executor.GetCurrentVPN(ctx)

			if tt.expectedError != nil {
				require.Error(t, err)
				if errors.Is(tt.expectedError, errs.ErrVPNServiceNotFound) {
					assert.Equal(t, errs.ErrVPNServiceNotFound, err)
				} else {
					assert.Contains(t, err.Error(), tt.expectedError.Error())
				}
				assert.Empty(t, result)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestExecutor_OpenInFinder(t *testing.T) {
	tests := []struct {
		name                string
		path                string
		commandError        error
		expectedError       string
		expectedCommandArgs []string
	}{
		{
			name:                "successful open in finder",
			path:                "/Users/test/Documents",
			expectedCommandArgs: []string{"-R", "/Users/test/Documents"},
		},
		{
			name:                "successful open with file path",
			path:                "/Users/test/file.txt",
			expectedCommandArgs: []string{"-R", "/Users/test/file.txt"},
		},
		{
			name:                "successful open with spaces in path",
			path:                "/Users/test/My Documents/file.txt",
			expectedCommandArgs: []string{"-R", "/Users/test/My Documents/file.txt"},
		},
		{
			name:                "command execution error",
			path:                "/nonexistent/path",
			commandError:        errors.New("open command failed"),
			expectedError:       "failed to sync execute command: open command failed",
			expectedCommandArgs: []string{"-R", "/nonexistent/path"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
			executor := NewExecutorWithRunner(mockRunner)
			ctx := context.Background()

			mockRunner.EXPECT().
				Run(ctx, cmdOpen, tt.expectedCommandArgs[0], tt.expectedCommandArgs[1]).
				Return([]string{}, tt.commandError).
				Times(1)

			err := executor.OpenInFinder(ctx, tt.path)

			if tt.expectedError != "" {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestExecutor_ContextPropagation(t *testing.T) {
	type contextKey string
	const testKey contextKey = "test"

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRunner := mock_usecase.NewMockCommandRunner(ctrl)
	executor := NewExecutorWithRunner(mockRunner)

	ctx := context.WithValue(context.Background(), testKey, "test-value")

	mockRunner.EXPECT().
		Run(gomock.Any(), gomock.Any(), gomock.Any()).
		DoAndReturn(func(receivedCtx context.Context, _ string, _ ...string) ([]string, error) {
			assert.Equal(t, "test-value", receivedCtx.Value(testKey))
			return []string{"interface wlan0"}, nil
		}).
		AnyTimes()

	mockRunner.EXPECT().
		Run(gomock.Any(), gomock.Any(), gomock.Any()).
		DoAndReturn(func(receivedCtx context.Context, _ string, _ ...string) ([]string, error) {
			assert.Equal(t, "test-value", receivedCtx.Value(testKey))
			return []string{}, nil
		}).
		AnyTimes()

	_, _ = executor.GetDefaultNetworkInterface(ctx)
	_, _ = executor.ListVPN(ctx)
	_, _ = executor.GetCurrentVPN(ctx)
	_ = executor.OpenInFinder(ctx, "/test/path")
}
