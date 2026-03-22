import React, { useState, useRef, useEffect } from "react";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import type { AttendanceStatus } from "../types/api";

interface AttendanceDropdownProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
  size?: "small" | "default" | "large";
}

const AttendanceDropdown: React.FC<AttendanceDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  size = "small",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const statusConfig = {
    present: {
      color: "#52c41a",
      bgColor: "#f6ffed",
      borderColor: "#b7eb8f",
      icon: <CheckCircleFilled />,
      label: "Present",
      hoverBg: "#d9f7be",
    },
    absent: {
      color: "#ff4d4f",
      bgColor: "#fff2f0",
      borderColor: "#ffccc7",
      icon: <CloseCircleFilled />,
      label: "Absent",
      hoverBg: "#ffe1dd",
    },
  };

  const currentStatus = statusConfig[value];

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return "bottom";

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 80; // Approximate height of dropdown
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    // If there's not enough space below and more space above, show dropdown above
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      return "top";
    }

    return "bottom";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen) {
      const position = calculateDropdownPosition();
      setDropdownPosition(position);
    }
  }, [isOpen]);

  const handleStatusChange = (newStatus: AttendanceStatus) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const buttonHeight =
    size === "small" ? "24px" : size === "large" ? "40px" : "32px";
  const fontSize =
    size === "small" ? "12px" : size === "large" ? "16px" : "14px";
  const iconSize = size === "small" ? "12px" : "14px";

  const getDropdownStyles = () => {
    const baseStyles = {
      position: "absolute" as const,
      left: "0",
      right: "0",
      backgroundColor: "#fff",
      border: "1px solid #d9d9d9",
      borderRadius: "6px",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
      zIndex: 9999, // Very high z-index to ensure it appears above everything
      marginTop: dropdownPosition === "bottom" ? "2px" : undefined,
      marginBottom: dropdownPosition === "top" ? "2px" : undefined,
      overflow: "hidden",
    };

    if (dropdownPosition === "top") {
      return {
        ...baseStyles,
        bottom: "100%",
      };
    } else {
      return {
        ...baseStyles,
        top: "100%",
      };
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        display: "inline-block",
        width: "100%",
        zIndex: 1, // Ensure the container has a stacking context
      }}
    >
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={disabled}
        style={{
          width: "100%",
          height: buttonHeight,
          border: `1px solid ${currentStatus.borderColor}`,
          borderRadius: "6px",
          backgroundColor: disabled ? "#f5f5f5" : currentStatus.bgColor,
          color: disabled ? "#d9d9d9" : currentStatus.color,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          fontSize,
          fontWeight: "500",
          transition: "all 0.2s ease",
          outline: "none",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = currentStatus.hoverBg;
            e.currentTarget.style.borderColor = currentStatus.color;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = currentStatus.bgColor;
            e.currentTarget.style.borderColor = currentStatus.borderColor;
          }
        }}
      >
        <span style={{ fontSize: iconSize }}>{currentStatus.icon}</span>
        <span>{currentStatus.label}</span>
        {!disabled && (
          <span
            style={{
              fontSize: "10px",
              marginLeft: "auto",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div style={getDropdownStyles()}>
          {Object.entries(statusConfig).map(([status, config]) => {
            const isSelected = status === value;
            return (
              <div
                key={status}
                onClick={() => handleStatusChange(status as AttendanceStatus)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: isSelected ? config.bgColor : "#fff",
                  borderLeft: isSelected
                    ? `3px solid ${config.color}`
                    : "3px solid transparent",
                  transition: "all 0.2s ease",
                  fontSize,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }
                }}
              >
                <span style={{ color: config.color, fontSize: iconSize }}>
                  {config.icon}
                </span>
                <span
                  style={{
                    color: isSelected ? config.color : "#262626",
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {config.label}
                </span>
                {isSelected && (
                  <span
                    style={{
                      marginLeft: "auto",
                      color: config.color,
                      fontSize: "12px",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendanceDropdown;
