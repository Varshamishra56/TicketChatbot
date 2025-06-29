// utils/isTicketNumber.js
export default function isTicketNumber(text) {
  return /^TKT[A-Z0-9]{8}$/i.test(text.trim());
}
