import React, { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://sms-backend-production-eedb.up.railway.app";

const DeleteAccount: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [params] = useSearchParams();
  const variant = (params.get("type") || "teacher").toLowerCase();

  const [phoneNumber, setPhoneNumber] = useState(params.get("phone") || "");
  const [schoolCode, setSchoolCode] = useState(params.get("schoolCode") || "");
  const [studentCode, setStudentCode] = useState(
    params.get("studentCode") || ""
  );
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const isTeacher = useMemo(() => variant === "teacher", [variant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResultMsg(null);

    try {
      const body: any = {
        type: isTeacher ? "DELETE_ACCOUNT_TEACHER" : "DELETE_ACCOUNT_STUDENT",
        note: "Submitted from website delete page",
      };
      if (isTeacher) {
        body.phoneNumber = phoneNumber.trim();
        if (schoolCode.trim())
          body.schoolCode = schoolCode.trim().toUpperCase();
      } else {
        body.studentCode = studentCode.trim();
      }

      const res = await fetch(`${API_BASE}/central/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        setResultMsg(
          isTeacher
            ? t("deleteAccount.successTeacher")
            : t("deleteAccount.successStudent")
        );
      } else {
        setResultMsg(json?.message || t("deleteAccount.error"));
      }
    } catch (err) {
      setResultMsg(t("deleteAccount.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="legal-page" style={{ paddingTop: 40 }}>
      <Link to="/" className="back-to-home">
        {t("deleteAccount.backToHome")}
      </Link>
      <div className="container">
        <div className="legal-content" style={{ maxWidth: 700 }}>
          <h1>{t("deleteAccount.title")}</h1>
          <p className="last-updated">{t("deleteAccount.subtitle")}</p>

          <div className="legal-section">
            <h2>{t("deleteAccount.warningTitle")}</h2>
            <p>{t("deleteAccount.warningBody")}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 16 }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {isTeacher ? (
              <>
                <div>
                  <label style={{ display: "block", marginBottom: 6 }}>
                    {t("deleteAccount.phoneNumber")}
                  </label>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="07xxxxxxxx"
                    style={{ width: "100%", padding: 12, borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6 }}>
                    {t("deleteAccount.schoolCode")}
                  </label>
                  <input
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder="ABC123"
                    style={{ width: "100%", padding: 12, borderRadius: 8 }}
                  />
                </div>
              </>
            ) : (
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>
                  {t("deleteAccount.studentCode")}
                </label>
                <input
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  required
                  placeholder="STU-0001"
                  style={{ width: "100%", padding: 12, borderRadius: 8 }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                {t("deleteAccount.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: "100%", padding: 12, borderRadius: 8 }}
              />
              <small style={{ color: "#bbb" }}>
                {t("deleteAccount.passwordNote")}
              </small>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%)",
                color: "white",
                border: "none",
                padding: "14px 20px",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {submitting
                ? t("deleteAccount.processing")
                : t("deleteAccount.deleteButton")}
            </button>

            {resultMsg && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(255,71,87,0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,71,87,0.3)",
                }}
              >
                {resultMsg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
