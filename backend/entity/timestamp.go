package entity

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// Timestamp is a custom time type that handles JSON marshaling properly for Wails.
type Timestamp struct {
	time.Time
}

// NewTimestamp creates a new Timestamp with the current time.
func NewTimestamp() Timestamp {
	return Timestamp{Time: time.Now()}
}

// TimestampFromTime creates a Timestamp from a time.Time.
func TimestampFromTime(t time.Time) Timestamp {
	return Timestamp{Time: t}
}

// MarshalJSON implements json.Marshaler interface.
func (t *Timestamp) MarshalJSON() ([]byte, error) {
	return json.Marshal(t.Format(time.RFC3339))
}

// UnmarshalJSON implements json.Unmarshaler interface.
func (t *Timestamp) UnmarshalJSON(data []byte) error {
	var timeStr string
	if err := json.Unmarshal(data, &timeStr); err != nil {
		return err
	}

	parsedTime, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return err
	}

	t.Time = parsedTime
	return nil
}

// String returns the time formatted as RFC3339.
func (t *Timestamp) String() string {
	return t.Format(time.RFC3339)
}

// Scan implements the sql.Scanner interface for database reads.
func (t *Timestamp) Scan(value any) error {
	if value == nil {
		t.Time = time.Time{}
		return nil
	}

	switch v := value.(type) {
	case time.Time:
		t.Time = v
	case string:
		parsedTime, err := time.Parse("2006-01-02 15:04:05", v)
		if err != nil {
			// Try RFC3339 format
			parsedTime, err = time.Parse(time.RFC3339, v)
			if err != nil {
				return fmt.Errorf("cannot parse time string: %w", err)
			}
		}
		t.Time = parsedTime
	case []byte:
		return t.Scan(string(v))
	default:
		return fmt.Errorf("cannot scan %T into Timestamp", value)
	}

	return nil
}

// Value implements the driver.Valuer interface for database writes.
func (t *Timestamp) Value() (driver.Value, error) {
	return t.Time, nil
}
