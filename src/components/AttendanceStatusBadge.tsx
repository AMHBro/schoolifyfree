import React from "react";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import type { AttendanceStatus } from "../types/api";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  size?: "small" | "default" | "large";
  showLabel?: boolean;
  animated?: boolean;
}

const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  size = "default",
  showLabel = true,
  animated = false,
}) => {
  const statusConfig = {
    present: {
      color: "#52c41a",
      bgColor: "#f6ffed",
      borderColor: "#b7eb8f",
      icon: <CheckCircleFilled />,
      label: "Present",
      pulse: "0 0 0 4px rgba(82, 196, 26, 0.3)",
    },
    absent: {
      color: "#ff4d4f",
      bgColor: "#fff2f0",
      borderColor: "#ffccc7",
      icon: <CloseCircleFilled />,
      label: "Absent",
      pulse: "0 0 0 4px rgba(255, 77, 79, 0.3)",
    },
  };

  const config = statusConfig[status];

  const sizeConfig = {
    small: {
      padding: "2px 6px",
      fontSize: "11px",
      iconSize: "10px",
      borderRadius: "3px",
    },
    default: {
      padding: "4px 8px",
      fontSize: "12px",
      iconSize: "12px",
      borderRadius: "4px",
    },
    large: {
      padding: "6px 12px",
      fontSize: "14px",
      iconSize: "14px",
      borderRadius: "6px",
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: currentSize.padding,
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
        borderRadius: currentSize.borderRadius,
        fontSize: currentSize.fontSize,
        fontWeight: "500",
        transition: "all 0.2s ease",
        boxShadow: animated ? config.pulse : "none",
      }}
    >
      <span style={{ fontSize: currentSize.iconSize }}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

export default AttendanceStatusBadge;
