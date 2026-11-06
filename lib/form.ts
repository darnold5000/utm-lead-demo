export function validateContact(input: { name: string; email: string; phone: string }) {
  const errors: { name?: string; email?: string; phone?: string } = {}
  const parts = input.name.trim().split(/\s+/).filter(Boolean)

  if (parts.length < 2) {
    errors.name = "Enter a first and last name."
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Enter an email address."
  }

  const digits = input.phone.replace(/\D/g, "")
  if (digits.length < 10) {
    errors.phone = "Enter a 10-digit phone number."
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}
