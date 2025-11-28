import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const emails = new SharedArray("emails", function () {
  return open("./emails.csv")
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line !== "");
});

export const options = {
  stages: [
    { duration: "30s", target: 500 },
    { duration: "1m", target: 500 },
    { duration: "30", target: 1500 },
    { duration: "1m", target: 1500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

function getRandomEmail() {
  return emails[Math.floor(Math.random() * emails.length)];
}

export default function () {
  const baseUrl = "";
  const url = `${baseUrl}/auth/forgot-password`;

  const payload = JSON.stringify({
    email: getRandomEmail(),
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
export function handleSummary(data) {
  return {
    "requestPasswordReset.html": htmlReport(data),
  };
}
