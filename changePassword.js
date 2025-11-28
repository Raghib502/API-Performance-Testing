import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const emails = new SharedArray("emails", function () {
  return open("./emails.csv")
    .split("\n")
    .map((email) => email.trim())
    .filter((email) => email !== "");
});

const baseUrl = "";

export const options = {
  vus: 500,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const email = emails[Math.floor(Math.random() * emails.length)];

  const forgotPasswordPayload = JSON.stringify({ email: email });
  const forgotPasswordResponse = http.post(
    `${baseUrl}/auth/forgot-password`,
    forgotPasswordPayload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(forgotPasswordResponse, {
    "Forgot Password request successful": (r) => r.status === 200,
    "Forgot Password response indicates success": (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch (e) {
        return false;
      }
    },
  });

  let verificationCode;
  try {
    const responseBody = JSON.parse(forgotPasswordResponse.body);
    verificationCode = responseBody.data.__x_code;
    check(verificationCode, {
      "Verification code received": (code) => code && code.length === 6,
    });
  } catch (e) {
    console.error(
      "Failed to parse forgot-password response or extract code:",
      e
    );
    return;
  }

  sleep(1);

  const newPassword = "";
  const resetPasswordPayload = JSON.stringify({
    email: email,
    verificationCode: verificationCode,
    password: newPassword,
    confirmPassword: newPassword,
  });
  const resetPasswordResponse = http.post(
    `${baseUrl}/auth/reset-password`,
    resetPasswordPayload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  check(resetPasswordResponse, {
    "Password reset successful": (r) => r.status === 200,
  });

  sleep(1);
}
export function handleSummary(data) {
  return {
    "resetPassword.html": htmlReport(data),
  };
}
