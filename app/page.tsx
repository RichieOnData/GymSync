import { FeatureCard } from "@/components/feature-card"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import Testimonials from "@/components/Testimonials"
import { PricingCard } from "@/components/pricing-card"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center"
        style={{ backgroundImage: 'url("https://images.squarespace-cdn.com/content/v1/5c7bfaae9b7d15430fc5c117/1598838581230-9YLKWMYTEFAXK6M4S5VS/image-asset.jpeg?format=2500w")', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="container px-4 mx-auto text-center">
          <div className="mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-aNG1E2AylxNoC1BWZ7m3CPk5AMLGvI.png"
              alt="GymSync Logo"
              width={500}
              height={500}
              className="mx-auto"
            />
          </div>
          <div className="">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-red-600 bg-black inline-block p-2">
              Revolutionize Your Gym with AI
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-red-600 max-w-3xl mx-auto font-bold">
              Transform your gym operations with cutting-edge AI technology that delivers personalized experiences and optimizes every aspect of your business.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-full border-red-600 text-red-600 hover:bg-red-600/10 px-8 py-6 text-lg"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Admin Tools Section */}
      <section className="py-20 bg-black">
        <div className="container px-4 mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">⚡ Powerful Tools for Gym Admins ⚡</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="analytics"
              title="Advanced Analytics Dashboard"
              description="Gain deep insights into gym performance and member behavior."
            />
            <FeatureCard
              icon="retention"
              title="Member Retention Prediction"
              description="AI-powered system to identify and retain at-risk members."
            />
            <FeatureCard
              icon="equipment"
              title="Equipment Optimization"
              description="Data-driven recommendations for equipment purchases and placement."
            />
            <FeatureCard
              icon="staffing"
              title="Automated Staffing"
              description="AI scheduling to optimize staff allocation based on peak hours."
            />
            <FeatureCard
              icon="fraud"
              title="Fraud Detection"
              description="Advanced AI algorithms to detect and prevent membership fraud."
            />
            <FeatureCard
              icon="rules"
              title="Customizable AI Rules"
              description="Tailor AI behavior to fit your gym's unique needs and policies."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-black">
        <div className="container px-4 mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">💹 Choose Your Plan 💹</h2>
          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl">
              <PricingCard
                title="Pro Plan"
                subtitle="For Local/Small Gyms"
                price="2,499"
                features={[
                  "All Basic Features",
                  "Advanced AI Business Analytics",
                  "Performance Tracking",
                  "Automated Gym Operations",
                ]}
                buttonText={<span className="text-lg">Choose Plan</span>}
              />
              <PricingCard
                title="Large Gym Plan"
                subtitle="For Gym Owners & Managers"
                price="14,999"
                features={[
                  "All Pro Features for up to 50 members",
                  "Admin Analytics Dashboard",
                  "Equipment Optimization",
                  "Member Retention Prediction",
                  "Customizable AI Rules",
                ]}
                buttonText={<span className="text-lg">Choose Plan</span>}
              />
              <PricingCard
                title="Enterprise Plan"
                subtitle="For Large Gym Chains"
                price="Custom Pricing"
                features={[
                  "All Gym Admin Features",
                  "Unlimited Member & Staff Accounts",
                  "Multi-Location Support",
                  "White-Label Solution",
                  "24/7 Priority Support",
                ]}
                buttonText={<span className="text-lg">Contact Sales</span>}
              />
            </div>
          </div>
          <p className="text-center text-white mt-8">
            All prices are in Indian Rupees (INR). GST will be added where applicable.
          </p>
        </div>
      </section>
   
      {/* Footer */}
      <Testimonials />
      <Footer />
    </div>
  )
}

