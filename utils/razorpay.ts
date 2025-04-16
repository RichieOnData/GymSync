declare global {
  interface Window {
    Razorpay: any
  }
}

export interface PaymentOptions {
  amount: number
  currency?: string
  name: string
  description: string
  orderId: string
  email: string
  contact?: string
}

export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

export const makePayment = async (options: PaymentOptions) => {
  const res = await initializeRazorpay()

  if (!res) {
    alert("Razorpay SDK failed to load. Please check your internet connection.")
    return
  }

  const razorpay = new window.Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: options.amount * 100, // Razorpay expects amount in paise
    currency: options.currency || "INR",
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    handler: (response: any) => {
      // Handle successful payment
      console.log(response)
    },
    prefill: {
      email: options.email,
      contact: options.contact,
    },
    theme: {
      color: "#dc2626", // Red-600 to match our theme
    },
  })

  razorpay.open()
}

