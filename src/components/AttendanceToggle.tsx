import React, { useState } from "react";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from "@ant-design/icons";
import type { AttendanceStatus } from "../types/api";

interface AttendanceToggleProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
  size?: "small" | "default" | "large";
  loading?: boolean;
}

const AttendanceToggle: React.FC<AttendanceToggleProps> = ({
  value,
  onChange,
  disabled = false,
  size = "small",
  loading = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

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
  const nextStatus = value === "present" ? "absent" : "present";

  const handleToggle = async () => {
    if (disabled || loading) return;

    setIsAnimating(true);
    onChange(nextStatus);

    // Reset animation after a short delay
    setTimeout(() => {
      setIsAnimating(false);
    }, 200);
  };

  const sizeConfig = {
    small: {
      height: "24px",
      fontSize: "12px",
      iconSize: "12px",
      padding: "0 8px",
    },
    default: {
      height: "32px",
      fontSize: "14px",
      iconSize: "14px",
      padding: "0 12px",
    },
    large: {
      height: "40px",
      fontSize: "16px",
      iconSize: "16px",
      padding: "0 16px",
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || loading}
      style={{
        width: "100%",
        height: currentSize.height,
        border: `1px solid ${currentStatus.borderColor}`,
        borderRadius: "6px",
        backgroundColor: disabled ? "#f5f5f5" : currentStatus.bgColor,
        color: disabled ? "#d9d9d9" : currentStatus.color,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: currentSize.fontSize,
        fontWeight: "500",
        transition: "all 0.2s ease",
        outline: "none",
        position: "relative",
        transform: isAnimating ? "scale(0.95)" : "scale(1)",
        boxShadow: isAnimating ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = currentStatus.hoverBg;
          e.currentTarget.style.borderColor = currentStatus.color;
          e.currentTarget.style.transform = "scale(1.02)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.backgroundColor = currentStatus.bgColor;
          e.currentTarget.style.borderColor = currentStatus.borderColor;
          e.currentTarget.style.transform = isAnimating
            ? "scale(0.95)"
            : "scale(1)";
        }
      }}
      title={`Click to mark as ${nextStatus}`}
    >
      <span
        style={{
          fontSize: currentSize.iconSize,
          transition: "transform 0.2s ease",
          transform: isAnimating ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        {loading ? <LoadingOutlined /> : currentStatus.icon}
      </span>
      <span>{currentStatus.label}</span>
    </button>
  );
};

export default AttendanceToggle;
