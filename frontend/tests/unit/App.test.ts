import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import App from "@/App.vue";
import { useNavigationStore, useUIStore } from "@/stores";
import type { entity } from "@/wailsjs/go/models";
import type { Notification } from "@/types";

// Mock heroicons
vi.mock("@heroicons/vue/24/outline", () => ({
  CheckCircleIcon: {
    name: "CheckCircleIcon",
    __name: "CheckCircleIcon",
    render: () => null,
  },
  CloudIcon: {
    name: "CloudIcon",
    __name: "CloudIcon",
    render: () => null,
  },
  ExclamationTriangleIcon: {
    name: "ExclamationTriangleIcon",
    __name: "ExclamationTriangleIcon",
    render: () => null,
  },
  ServerIcon: {
    name: "ServerIcon",
    __name: "ServerIcon",
    render: () => null,
  },
}));

// Mock child components
vi.mock("@/components/layout/LoadingOverlay.vue", () => ({
  default: {
    name: "LoadingOverlay",
    props: ["show", "message"],
    template:
      '<div data-testid="loading-overlay" v-if="show">{{ message }}</div>',
  },
}));

vi.mock("@/components/ui", () => ({
  ConfirmDialog: {
    name: "ConfirmDialog",
    props: ["visible", "title", "message", "confirmText", "cancelText", "type"],
    emits: ["confirm", "cancel"],
    template:
      '<div data-testid="confirm-dialog" v-if="visible">{{ title }}: {{ message }}</div>',
  },
}));

vi.mock("@/components/NetworksScreen.vue", () => ({
  default: {
    name: "NetworksScreen",
    props: ["onNetworkSelect"],
    emits: ["error", "success"],
    template: '<div data-testid="networks-screen">Networks Screen</div>',
  },
}));

vi.mock("@/components/NetworkHostsScreen.vue", () => ({
  default: {
    name: "NetworkHostsScreen",
    props: ["network", "onGoBack"],
    emits: ["error", "success", "loading-start", "loading-end"],
    template:
      '<div data-testid="network-hosts-screen">Network Hosts Screen</div>',
  },
}));

vi.mock("@/components/HostsScreen.vue", () => ({
  default: {
    name: "HostsScreen",
    emits: ["error", "success"],
    template: '<div data-testid="hosts-screen">Hosts Screen</div>',
  },
}));

describe("App.vue", () => {
  let wrapper: VueWrapper<any>;
  let navigationStore: ReturnType<typeof useNavigationStore>;
  let uiStore: ReturnType<typeof useUIStore>;

  const createWrapper = () => {
    if (wrapper) {
      wrapper.unmount();
    }

    const pinia = createPinia();
    setActivePinia(pinia);

    navigationStore = useNavigationStore();
    uiStore = useUIStore();

    wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });

    return wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("Component mounting and initialization", () => {
    it("renders without crashing", () => {
      createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it("navigates to networks screen on mount", async () => {
      createWrapper();
      await nextTick();
      expect(navigationStore.currentScreen).toBe("networks");
    });

    it("renders the header with title and icon", () => {
      createWrapper();
      const header = wrapper.find("h1");
      expect(header.text()).toBe("Splitr");

      const subtitle = wrapper.find("p");
      expect(subtitle.text()).toBe("L2TP VPN Split Tunneling");
    });
  });

  describe("Navigation tabs", () => {
    it("renders navigation tabs when not on networkHosts screen", () => {
      createWrapper();
      navigationStore.navigateToNetworks();

      const navTabs = wrapper.find("nav");
      expect(navTabs.exists()).toBe(true);

      const buttons = wrapper.findAll("button");
      const networkButton = buttons.find((btn) =>
        btn.text().includes("Networks"),
      );
      const hostsButton = buttons.find((btn) => btn.text().includes("Hosts"));

      expect(networkButton?.exists()).toBe(true);
      expect(hostsButton?.exists()).toBe(true);
    });

    it("hides navigation tabs on networkHosts screen", async () => {
      createWrapper();

      const mockNetwork: entity.NetworkWithStatus = {
        ID: 1,
        Name: "test-network",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T00:00:00Z",
        Status: { IsActive: false, HostCount: 0, IsSetup: false },
      };

      navigationStore.navigateToNetworkHosts(mockNetwork);
      await nextTick();

      const navTabs = wrapper.find("nav");
      expect(navTabs.exists()).toBe(false);
    });

    it("applies correct styling to active tab", async () => {
      createWrapper();
      navigationStore.navigateToNetworks();
      await nextTick();

      const buttons = wrapper.findAll("button");
      const networksButton = buttons.find((btn) =>
        btn.text().includes("Networks"),
      );

      expect(networksButton?.classes()).toContain("border-blue-500");
      expect(networksButton?.classes()).toContain("text-blue-600");
    });

    it("handles navigation tab clicks", async () => {
      createWrapper();

      const buttons = wrapper.findAll("button");
      const hostsButton = buttons.find((btn) => btn.text().includes("Hosts"));

      if (hostsButton) {
        await hostsButton.trigger("click");
        expect(navigationStore.currentScreen).toBe("hosts");
      }
    });

    it("disables navigation tabs when globally loading", async () => {
      createWrapper();
      uiStore.showGlobalLoading("Loading...");
      await nextTick();

      const buttons = wrapper.findAll("button");
      const navButtons = buttons.filter(
        (btn) =>
          btn.text().includes("Networks") || btn.text().includes("Hosts"),
      );

      navButtons.forEach((button) => {
        expect(button.attributes("disabled")).toBeDefined();
      });
    });
  });

  describe("Screen rendering", () => {
    it("renders NetworksScreen when on networks screen", async () => {
      createWrapper();
      navigationStore.navigateToNetworks();
      await nextTick();

      const networksScreen = wrapper.find('[data-testid="networks-screen"]');
      expect(networksScreen.exists()).toBe(true);
    });

    it("renders HostsScreen when on hosts screen", async () => {
      createWrapper();
      navigationStore.navigateToHosts();
      await nextTick();

      const hostsScreen = wrapper.find('[data-testid="hosts-screen"]');
      expect(hostsScreen.exists()).toBe(true);
    });

    it("renders NetworkHostsScreen when on networkHosts screen with selected network", async () => {
      createWrapper();

      const mockNetwork: entity.NetworkWithStatus = {
        ID: 1,
        Name: "test-network",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T00:00:00Z",
        Status: { IsActive: false, HostCount: 0, IsSetup: false },
      };

      navigationStore.navigateToNetworkHosts(mockNetwork);
      await nextTick();

      const networkHostsScreen = wrapper.find(
        '[data-testid="network-hosts-screen"]',
      );
      expect(networkHostsScreen.exists()).toBe(true);
    });
  });

  describe("Event handlers", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("handles screen changes", async () => {
      const clearSpy = vi.spyOn(uiStore, "clearAllNotifications");

      await wrapper.vm.handleScreenChange("hosts");

      expect(clearSpy).toHaveBeenCalled();
      expect(navigationStore.currentScreen).toBe("hosts");
    });

    it("handles network selection", async () => {
      const clearSpy = vi.spyOn(uiStore, "clearAllNotifications");
      const mockNetwork: entity.NetworkWithStatus = {
        ID: 1,
        Name: "test-network",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T00:00:00Z",
        Status: { IsActive: false, HostCount: 0, IsSetup: false },
      };

      await wrapper.vm.handleNetworkSelect(mockNetwork);

      expect(clearSpy).toHaveBeenCalled();
      expect(navigationStore.currentScreen).toBe("networkHosts");
      expect(navigationStore.selectedNetwork).toEqual(mockNetwork);
    });

    it("handles error messages", async () => {
      const showErrorSpy = vi.spyOn(uiStore, "showError");

      await wrapper.vm.handleError("Test error");

      expect(showErrorSpy).toHaveBeenCalledWith("Error", "Test error");
    });

    it("handles success messages", async () => {
      const showSuccessSpy = vi.spyOn(uiStore, "showSuccess");

      await wrapper.vm.handleSuccess("Test success");

      expect(showSuccessSpy).toHaveBeenCalledWith("Success", "Test success");
    });

    it("handles loading start", async () => {
      const showLoadingSpy = vi.spyOn(uiStore, "showGlobalLoading");

      await wrapper.vm.handleLoadingStart("Loading test...");

      expect(showLoadingSpy).toHaveBeenCalledWith("Loading test...");
    });

    it("handles loading end", async () => {
      const hideLoadingSpy = vi.spyOn(uiStore, "hideGlobalLoading");

      await wrapper.vm.handleLoadingEnd();

      expect(hideLoadingSpy).toHaveBeenCalled();
    });

    it("handles go back to networks", async () => {
      await wrapper.vm.goBackToNetworks();

      expect(navigationStore.currentScreen).toBe("networks");
    });
  });

  describe("Notification system", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("renders notifications correctly", async () => {
      const testNotification: Notification = {
        id: "1",
        type: "success",
        title: "Test Success",
        message: "This is a test message",
        timestamp: new Date(),
      };

      uiStore.notifications.push(testNotification);
      await nextTick();

      const notificationDiv = wrapper.find(".bg-green-100");
      expect(notificationDiv.exists()).toBe(true);
      expect(notificationDiv.text()).toContain("Test Success");
      expect(notificationDiv.text()).toContain("This is a test message");
    });

    it("applies correct classes for different notification types", () => {
      expect(wrapper.vm.getNotificationClasses("error")).toContain(
        "bg-red-100",
      );
      expect(wrapper.vm.getNotificationClasses("success")).toContain(
        "bg-green-100",
      );
      expect(wrapper.vm.getNotificationClasses("warning")).toContain(
        "bg-yellow-100",
      );
      expect(wrapper.vm.getNotificationClasses("info")).toContain(
        "bg-blue-100",
      );
    });

    it("returns correct icons for notification types", () => {
      const errorIcon = wrapper.vm.getNotificationIcon("error");
      const warningIcon = wrapper.vm.getNotificationIcon("warning");
      const successIcon = wrapper.vm.getNotificationIcon("success");
      const defaultIcon = wrapper.vm.getNotificationIcon("unknown");

      // Icons are Vue components, so we check their component name or __name property
      expect(errorIcon.name || errorIcon.__name).toBe(
        "ExclamationTriangleIcon",
      );
      expect(warningIcon.name || warningIcon.__name).toBe(
        "ExclamationTriangleIcon",
      );
      expect(successIcon.name || successIcon.__name).toBe("CheckCircleIcon");
      expect(defaultIcon.name || defaultIcon.__name).toBe("CheckCircleIcon");
    });

    it("handles notification removal", async () => {
      const testNotification: Notification = {
        id: "1",
        type: "info",
        title: "Test",
        message: "Test message",
        timestamp: new Date(),
      };

      uiStore.notifications.push(testNotification);
      await nextTick();

      const removeButton = wrapper.find('button[class*="ml-auto"]');
      const removeSpy = vi.spyOn(uiStore, "removeNotification");

      if (removeButton.exists()) {
        await removeButton.trigger("click");
        expect(removeSpy).toHaveBeenCalledWith("1");
      }
    });
  });

  describe("Global components", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("renders loading overlay when globalLoading is true", async () => {
      uiStore.showGlobalLoading("Loading test...");
      await nextTick();

      const loadingOverlay = wrapper.find('[data-testid="loading-overlay"]');
      expect(loadingOverlay.exists()).toBe(true);
      expect(loadingOverlay.text()).toBe("Loading test...");
    });

    it("hides loading overlay when globalLoading is false", async () => {
      uiStore.hideGlobalLoading();
      await nextTick();

      const loadingOverlay = wrapper.find('[data-testid="loading-overlay"]');
      expect(loadingOverlay.exists()).toBe(false);
    });

    it("renders confirm dialog when confirmDialogOpen is true", async () => {
      uiStore.confirmDialogProps.title = "Confirm Test";
      uiStore.confirmDialogProps.message = "Are you sure?";
      uiStore.confirmDialogOpen = true;
      await nextTick();

      const confirmDialog = wrapper.find('[data-testid="confirm-dialog"]');
      expect(confirmDialog.exists()).toBe(true);
      expect(confirmDialog.text()).toContain("Confirm Test");
      expect(confirmDialog.text()).toContain("Are you sure?");
    });

    it("handles confirm dialog confirm event", async () => {
      const confirmSpy = vi.spyOn(uiStore, "confirmDialog");
      uiStore.confirmDialogOpen = true;
      await nextTick();

      const confirmDialog = wrapper.findComponent({ name: "ConfirmDialog" });
      await confirmDialog.vm.$emit("confirm");

      expect(confirmSpy).toHaveBeenCalled();
    });

    it("handles confirm dialog cancel event", async () => {
      const cancelSpy = vi.spyOn(uiStore, "cancelDialog");
      uiStore.confirmDialogOpen = true;
      await nextTick();

      const confirmDialog = wrapper.findComponent({ name: "ConfirmDialog" });
      await confirmDialog.vm.$emit("cancel");

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe("Child component events", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("handles NetworksScreen error event", async () => {
      navigationStore.navigateToNetworks();
      await nextTick();

      const showErrorSpy = vi.spyOn(uiStore, "showError");

      const networksScreen = wrapper.findComponent({ name: "NetworksScreen" });
      await networksScreen.vm.$emit("error", "Network error");

      expect(showErrorSpy).toHaveBeenCalledWith("Error", "Network error");
    });

    it("handles NetworksScreen success event", async () => {
      navigationStore.navigateToNetworks();
      await nextTick();

      const showSuccessSpy = vi.spyOn(uiStore, "showSuccess");

      const networksScreen = wrapper.findComponent({ name: "NetworksScreen" });
      await networksScreen.vm.$emit("success", "Network success");

      expect(showSuccessSpy).toHaveBeenCalledWith("Success", "Network success");
    });

    it("handles NetworkHostsScreen loading events", async () => {
      const mockNetwork: entity.NetworkWithStatus = {
        ID: 1,
        Name: "test-network",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T00:00:00Z",
        Status: { IsActive: false, HostCount: 0, IsSetup: false },
      };

      navigationStore.navigateToNetworkHosts(mockNetwork);
      await nextTick();

      const networkHostsScreen = wrapper.findComponent({
        name: "NetworkHostsScreen",
      });
      const showLoadingSpy = vi.spyOn(uiStore, "showGlobalLoading");
      const hideLoadingSpy = vi.spyOn(uiStore, "hideGlobalLoading");

      await networkHostsScreen.vm.$emit("loading-start", "Loading hosts...");
      expect(showLoadingSpy).toHaveBeenCalledWith("Loading hosts...");

      await networkHostsScreen.vm.$emit("loading-end");
      expect(hideLoadingSpy).toHaveBeenCalled();
    });

    it("handles HostsScreen events", async () => {
      navigationStore.navigateToHosts();
      await nextTick();

      const hostsScreen = wrapper.findComponent({ name: "HostsScreen" });
      const showErrorSpy = vi.spyOn(uiStore, "showError");
      const showSuccessSpy = vi.spyOn(uiStore, "showSuccess");

      await hostsScreen.vm.$emit("error", "Host error");
      expect(showErrorSpy).toHaveBeenCalledWith("Error", "Host error");

      await hostsScreen.vm.$emit("success", "Host success");
      expect(showSuccessSpy).toHaveBeenCalledWith("Success", "Host success");
    });
  });

  describe("Computed properties", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("computes currentScreen correctly", async () => {
      navigationStore.navigateToNetworks();
      await nextTick();
      expect(wrapper.vm.currentScreen).toBe("networks");

      navigationStore.navigateToHosts();
      await nextTick();
      expect(wrapper.vm.currentScreen).toBe("hosts");
    });

    it("computes selectedNetwork correctly", async () => {
      const mockNetwork: entity.NetworkWithStatus = {
        ID: 1,
        Name: "test-network",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T00:00:00Z",
        Status: { IsActive: false, HostCount: 0, IsSetup: false },
      };

      navigationStore.navigateToNetworkHosts(mockNetwork);
      await nextTick();

      expect(wrapper.vm.selectedNetwork).toEqual(mockNetwork);
    });

    it("computes UI store properties correctly", async () => {
      uiStore.showGlobalLoading("Test loading");
      await nextTick();

      expect(wrapper.vm.globalLoading).toBe(true);
      expect(wrapper.vm.globalLoadingMessage).toBe("Test loading");

      uiStore.hideGlobalLoading();
      await nextTick();

      expect(wrapper.vm.globalLoading).toBe(false);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("handles networkHosts screen without selected network", async () => {
      navigationStore.currentScreen = "networkHosts";
      navigationStore.selectedNetwork = null;
      await nextTick();

      const networkHostsScreen = wrapper.find(
        '[data-testid="network-hosts-screen"]',
      );
      expect(networkHostsScreen.exists()).toBe(false);
    });

    it("handles unknown notification types gracefully", () => {
      const classes = wrapper.vm.getNotificationClasses("unknown");
      expect(classes).toBe("mb-4 px-4 py-3 rounded-lg flex items-center");

      const icon = wrapper.vm.getNotificationIcon("unknown");
      expect(icon.name || icon.__name).toBe("CheckCircleIcon");
    });

    it("handles empty notifications array", async () => {
      uiStore.notifications.splice(0);
      await nextTick();

      const notifications = wrapper.findAll(
        '[class*="bg-green-100"], [class*="bg-red-100"], [class*="bg-yellow-100"], [class*="bg-blue-100"]',
      );
      expect(notifications).toHaveLength(0);
    });

    it("handles multiple notifications of different types", async () => {
      createWrapper();

      const errorNotification: Notification = {
        id: "1",
        type: "error",
        title: "Error Title",
        message: "Error message",
        timestamp: new Date(),
      };

      const successNotification: Notification = {
        id: "2",
        type: "success",
        title: "Success Title",
        message: "Success message",
        timestamp: new Date(),
      };

      uiStore.notifications.push(errorNotification, successNotification);
      await nextTick();

      const errorDiv = wrapper.find(".bg-red-100");
      const successDiv = wrapper.find(".bg-green-100");

      expect(errorDiv.exists()).toBe(true);
      expect(successDiv.exists()).toBe(true);
      expect(errorDiv.text()).toContain("Error Title");
      expect(successDiv.text()).toContain("Success Title");
    });

    it("handles notification with no message", async () => {
      createWrapper();

      const testNotification: Notification = {
        id: "1",
        type: "info",
        title: "Info Title",
        message: "",
        timestamp: new Date(),
      };

      uiStore.notifications.push(testNotification);
      await nextTick();

      const notificationDiv = wrapper.find(".bg-blue-100");
      expect(notificationDiv.exists()).toBe(true);
      expect(notificationDiv.text()).toContain("Info Title");
      expect(notificationDiv.text()).not.toContain("Info message");
    });

    it("tests transition group for notifications", async () => {
      createWrapper();

      // TransitionGroup is a built-in Vue component, rendered as stub in tests
      expect(wrapper.html()).toContain("transition-group-stub");
    });
  });

  describe("Component lifecycle", () => {
    it("calls navigateToNetworks on mounted", async () => {
      // Create wrapper and check that navigation store is in correct state after mounting
      createWrapper();
      await nextTick();

      // After mounting, the current screen should be 'networks'
      expect(navigationStore.currentScreen).toBe("networks");
    });
  });

  describe("Screen change handlers with all cases", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("handles screen change to networks", async () => {
      const clearSpy = vi.spyOn(uiStore, "clearAllNotifications");

      await wrapper.vm.handleScreenChange("networks");

      expect(clearSpy).toHaveBeenCalled();
      expect(navigationStore.currentScreen).toBe("networks");
    });

    it("handles unknown screen change gracefully", async () => {
      const clearSpy = vi.spyOn(uiStore, "clearAllNotifications");

      // Test with unknown screen - should still clear notifications
      await wrapper.vm.handleScreenChange("unknown");

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe("Additional UI interactions", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("handles disabled state correctly during loading", async () => {
      uiStore.showGlobalLoading("Testing...");
      await nextTick();

      const buttons = wrapper.findAll("button");
      const disabledButtons = buttons.filter(
        (btn) =>
          btn.text().includes("Networks") || btn.text().includes("Hosts"),
      );

      disabledButtons.forEach((button) => {
        expect(button.attributes("disabled")).toBeDefined();
      });
    });

    it("renders correct confirm dialog props", async () => {
      uiStore.confirmDialogProps = {
        title: "Custom Title",
        message: "Custom Message",
        confirmText: "Yes",
        cancelText: "No",
        type: "danger",
      };
      uiStore.confirmDialogOpen = true;
      await nextTick();

      const confirmDialog = wrapper.findComponent({ name: "ConfirmDialog" });
      expect(confirmDialog.props().title).toBe("Custom Title");
      expect(confirmDialog.props().message).toBe("Custom Message");
      expect(confirmDialog.props().confirmText).toBe("Yes");
      expect(confirmDialog.props().cancelText).toBe("No");
      expect(confirmDialog.props().type).toBe("danger");
    });
  });

  describe("Network hosts screen edge cases", () => {
    beforeEach(() => {
      createWrapper();
    });

    it("passes correct props to NetworkHostsScreen", async () => {
      const mockNetwork: entity.NetworkWithStatus = {
        ID: 1,
        Name: "test-network",
        CreatedAt: "2024-01-01T00:00:00Z",
        UpdatedAt: "2024-01-01T00:00:00Z",
        Status: { IsActive: true, HostCount: 5, IsSetup: true },
      };

      navigationStore.navigateToNetworkHosts(mockNetwork);
      await nextTick();

      const networkHostsScreen = wrapper.findComponent({
        name: "NetworkHostsScreen",
      });

      expect(networkHostsScreen.exists()).toBe(true);
      expect(networkHostsScreen.props().network).toEqual(mockNetwork);
      expect(typeof networkHostsScreen.props().onGoBack).toBe("function");
    });

    it("passes correct props to NetworksScreen", async () => {
      navigationStore.navigateToNetworks();
      await nextTick();

      const networksScreen = wrapper.findComponent({ name: "NetworksScreen" });
      expect(networksScreen.exists()).toBe(true);
      expect(typeof networksScreen.props().onNetworkSelect).toBe("function");
    });
  });
});
