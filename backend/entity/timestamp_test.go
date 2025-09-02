package entity

import (
	"database/sql/driver"
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewTimestamp(t *testing.T) {
	before := time.Now()
	ts := NewTimestamp()
	after := time.Now()

	// The timestamp should be between before and after
	assert.True(t, ts.Time.After(before.Add(-time.Second)) && ts.Time.Before(after.Add(time.Second)))
	assert.False(t, ts.Time.IsZero())
}

func TestTimestampFromTime(t *testing.T) {
	originalTime := time.Date(2023, 12, 25, 15, 30, 45, 123456789, time.UTC)
	ts := TimestampFromTime(originalTime)

	assert.Equal(t, originalTime, ts.Time)
	assert.True(t, ts.Time.Equal(originalTime))
}

func TestTimestamp_MarshalJSON(t *testing.T) {
	testTime := time.Date(2023, 10, 15, 14, 30, 0, 0, time.UTC)
	ts := TimestampFromTime(testTime)

	data, err := ts.MarshalJSON()
	require.NoError(t, err)

	expected := `"2023-10-15T14:30:00Z"`
	assert.Equal(t, expected, string(data))
}

func TestTimestamp_MarshalJSON_ZeroTime(t *testing.T) {
	ts := Timestamp{}

	data, err := ts.MarshalJSON()
	require.NoError(t, err)

	expected := `"0001-01-01T00:00:00Z"`
	assert.Equal(t, expected, string(data))
}

func TestTimestamp_UnmarshalJSON_ValidRFC3339(t *testing.T) {
	tests := []struct {
		name     string
		jsonData string
		expected time.Time
	}{
		{
			name:     "UTC time",
			jsonData: `"2023-12-01T15:30:00Z"`,
			expected: time.Date(2023, 12, 1, 15, 30, 0, 0, time.UTC),
		},
		{
			name:     "time with timezone",
			jsonData: `"2023-12-01T15:30:00+02:00"`,
			expected: time.Date(2023, 12, 1, 13, 30, 0, 0, time.UTC), // converted to UTC
		},
		{
			name:     "time with nanoseconds",
			jsonData: `"2023-12-01T15:30:00.123456789Z"`,
			expected: time.Date(2023, 12, 1, 15, 30, 0, 123456789, time.UTC),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ts Timestamp
			err := ts.UnmarshalJSON([]byte(tt.jsonData))
			require.NoError(t, err)
			assert.True(t, ts.Time.Equal(tt.expected))
		})
	}
}

func TestTimestamp_UnmarshalJSON_InvalidData(t *testing.T) {
	tests := []struct {
		name     string
		jsonData string
	}{
		{
			name:     "invalid JSON",
			jsonData: `invalid json`,
		},
		{
			name:     "invalid time format",
			jsonData: `"2023-13-01T15:30:00Z"`, // invalid month
		},
		{
			name:     "non-string JSON",
			jsonData: `123`,
		},
		{
			name:     "empty string",
			jsonData: `""`,
		},
		{
			name:     "invalid RFC3339",
			jsonData: `"2023/12/01 15:30:00"`, // wrong format
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ts Timestamp
			err := ts.UnmarshalJSON([]byte(tt.jsonData))
			assert.Error(t, err)
		})
	}
}

func TestTimestamp_JSONMarshalUnmarshal_RoundTrip(t *testing.T) {
	originalTime := time.Date(2023, 8, 15, 9, 45, 30, 500000000, time.UTC)
	originalTS := TimestampFromTime(originalTime)

	// Marshal to JSON
	data, err := json.Marshal(originalTS)
	require.NoError(t, err)

	// Unmarshal from JSON
	var unmarshaledTS Timestamp
	err = json.Unmarshal(data, &unmarshaledTS)
	require.NoError(t, err)

	// Should be equal (with nanosecond precision preserved)
	assert.True(t, originalTS.Time.Equal(unmarshaledTS.Time))
}

func TestTimestamp_String(t *testing.T) {
	testTime := time.Date(2023, 7, 4, 12, 0, 0, 0, time.UTC)
	ts := TimestampFromTime(testTime)

	result := ts.String()
	expected := "2023-07-04T12:00:00Z"

	assert.Equal(t, expected, result)
}

func TestTimestamp_String_ZeroValue(t *testing.T) {
	ts := Timestamp{}
	result := ts.String()
	expected := "0001-01-01T00:00:00Z"

	assert.Equal(t, expected, result)
}

func TestTimestamp_Value(t *testing.T) {
	testTime := time.Date(2023, 6, 20, 10, 15, 0, 0, time.UTC)
	ts := TimestampFromTime(testTime)

	value, err := ts.Value()
	require.NoError(t, err)

	timeValue, ok := value.(time.Time)
	require.True(t, ok, "Value should return a time.Time")
	assert.True(t, testTime.Equal(timeValue))
}

func TestTimestamp_Value_ZeroTime(t *testing.T) {
	ts := Timestamp{}

	value, err := ts.Value()
	require.NoError(t, err)

	timeValue, ok := value.(time.Time)
	require.True(t, ok)
	assert.True(t, timeValue.IsZero())
}

func TestTimestamp_Scan_TimeValue(t *testing.T) {
	testTime := time.Date(2023, 5, 10, 8, 30, 0, 0, time.UTC)
	var ts Timestamp

	err := ts.Scan(testTime)
	require.NoError(t, err)

	assert.True(t, ts.Time.Equal(testTime))
}

func TestTimestamp_Scan_NilValue(t *testing.T) {
	var ts Timestamp

	err := ts.Scan(nil)
	require.NoError(t, err)

	assert.True(t, ts.Time.IsZero())
}

func TestTimestamp_Scan_StringValue(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected time.Time
	}{
		{
			name:     "standard database format",
			input:    "2023-12-25 15:30:45",
			expected: time.Date(2023, 12, 25, 15, 30, 45, 0, time.UTC),
		},
		{
			name:     "RFC3339 format",
			input:    "2023-12-25T15:30:45Z",
			expected: time.Date(2023, 12, 25, 15, 30, 45, 0, time.UTC),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var ts Timestamp
			err := ts.Scan(tt.input)
			require.NoError(t, err)
			assert.True(t, ts.Time.Equal(tt.expected))
		})
	}
}

func TestTimestamp_Scan_ByteSliceValue(t *testing.T) {
	input := []byte("2023-11-15 20:45:30")
	expected := time.Date(2023, 11, 15, 20, 45, 30, 0, time.UTC)

	var ts Timestamp
	err := ts.Scan(input)
	require.NoError(t, err)

	assert.True(t, ts.Time.Equal(expected))
}

func TestTimestamp_Scan_InvalidString(t *testing.T) {
	invalidStrings := []string{
		"invalid time",
		"2023-13-01 15:30:00", // invalid month
		"not-a-date",
		"2023/12/25 15:30:00", // wrong format
	}

	for _, invalidStr := range invalidStrings {
		t.Run("invalid_"+invalidStr, func(t *testing.T) {
			var ts Timestamp
			err := ts.Scan(invalidStr)
			assert.Error(t, err)
		})
	}
}

func TestTimestamp_Scan_UnsupportedType(t *testing.T) {
	unsupportedValues := []interface{}{
		123,
		123.45,
		true,
		[]string{"test"},
		map[string]string{"test": "value"},
	}

	for _, value := range unsupportedValues {
		t.Run("unsupported_type", func(t *testing.T) {
			var ts Timestamp
			err := ts.Scan(value)
			require.Error(t, err)
			assert.Contains(t, err.Error(), "cannot scan")
		})
	}
}

func TestTimestamp_ImplementsInterfaces(t *testing.T) {
	var ts Timestamp

	// Test that it implements json.Marshaler
	_, ok := interface{}(&ts).(json.Marshaler)
	assert.True(t, ok, "Timestamp should implement json.Marshaler")

	// Test that it implements json.Unmarshaler
	_, ok = interface{}(&ts).(json.Unmarshaler)
	assert.True(t, ok, "Timestamp should implement json.Unmarshaler")

	// Test that it implements driver.Valuer
	_, ok = interface{}(&ts).(driver.Valuer)
	assert.True(t, ok, "Timestamp should implement driver.Valuer")

	// Test that it implements sql.Scanner (implicitly through Scan method)
	// We test this by checking the Scan method exists and works
	err := ts.Scan(time.Now())
	assert.NoError(t, err)
}

func TestTimestamp_DatabaseRoundTrip(t *testing.T) {
	originalTime := time.Date(2023, 4, 1, 12, 30, 45, 0, time.UTC)
	ts := TimestampFromTime(originalTime)

	// Simulate database write
	value, err := ts.Value()
	require.NoError(t, err)

	// Simulate database read
	var newTS Timestamp
	err = newTS.Scan(value)
	require.NoError(t, err)

	assert.True(t, originalTime.Equal(newTS.Time))
}

func TestTimestamp_ConcurrentAccess(_ *testing.T) {
	ts := NewTimestamp()

	// Test concurrent reads
	done := make(chan bool, 10)
	for range 10 {
		go func() {
			_ = ts.String()
			_, _ = ts.Value()
			_, _ = ts.MarshalJSON()
			done <- true
		}()
	}

	// Wait for all goroutines to complete
	for range 10 {
		<-done
	}
}

func TestTimestamp_EdgeCaseTimes(t *testing.T) {
	edgeCases := []struct {
		name string
		time time.Time
	}{
		{
			name: "Unix epoch",
			time: time.Unix(0, 0).UTC(),
		},
		{
			name: "Year 1",
			time: time.Date(1, 1, 1, 0, 0, 0, 0, time.UTC),
		},
		{
			name: "Far future",
			time: time.Date(9999, 12, 31, 23, 59, 59, 999999999, time.UTC),
		},
		{
			name: "Leap year",
			time: time.Date(2024, 2, 29, 12, 0, 0, 0, time.UTC),
		},
	}

	for _, tc := range edgeCases {
		t.Run(tc.name, func(t *testing.T) {
			ts := TimestampFromTime(tc.time)

			// Test JSON round trip
			data, err := json.Marshal(ts)
			require.NoError(t, err)

			var unmarshaledTS Timestamp
			err = json.Unmarshal(data, &unmarshaledTS)
			require.NoError(t, err)

			assert.True(t, tc.time.Equal(unmarshaledTS.Time))

			// Test database round trip
			value, err := ts.Value()
			require.NoError(t, err)

			var scannedTS Timestamp
			err = scannedTS.Scan(value)
			require.NoError(t, err)

			assert.True(t, tc.time.Equal(scannedTS.Time))
		})
	}
}
