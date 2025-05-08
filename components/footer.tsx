import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* CTA Section */}
      <div className="border-t border-zinc-800">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-4 text-4xl font-bold text-red-600">Ready to Transform Your Gym?</h2>
          <p className="mb-8 text-gray-400">Join GymSync today and experience the power of AI-driven gym management.</p>
          <Button className="rounded-full bg-white text-red-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t border-zinc-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Logo and Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-aNG1E2AylxNoC1BWZ7m3CPk5AMLGvI.png"
                  alt="GymSync Logo"
                  width={40}
                  height={40}
                />
                <span className="text-xl font-bold">GymSync</span>
              </div>
              <p className="text-sm text-gray-400">AI-powered gym management and wellness tracking</p>
            </div>

            {/* Features */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Blogs</h3>
              <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link 
                href="https://medium.com/beingwell/a-walking-workout-that-will-transform-your-body-no-seriously-2427e5ffb689" 
                className="hover:text-white"
                target="_blank"  
                rel="noopener noreferrer"
                >
                  Workout Recommendations
                </Link>
              </li>
                <li>
                  <Link 
  
                href="https://medium.com/change-your-mind/a-nutrition-plan-that-aims-to-support-you-throughout-your-life-19f533192fee" 
                className="hover:text-white"
                target="_blank"  
                rel="noopener noreferrer"
                >
                    Nutrition Planning
                  </Link>
                </li>
                <li>
                  <Link 
                href="https://medium.com/change-your-mind/12-high-performance-habits-that-will-make-you-unstoppable-in-work-and-life-e02dc7c88591" 
                className="hover:text-white"
                target="_blank"  
                rel="noopener noreferrer"
                  >
                 
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
          

            {/* Connect */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Connect</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link 
                  href="https://medium.com/change-your-mind/a-nutrition-plan-that-aims-to-support-you-throughout-your-life-19f533192fee" 
                  className="hover:text-white"
                  target="_blank"  
                  rel="noopener noreferrer"
                  >
                  
                    
                  </Link>
                </li>
                <li>
                  <Link 
                  href="https://twitter.com/" 
                  className="hover:text-white"
                  target="_blank"  
                  rel="noopener noreferrer"
                  >
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link 
                  href="https://twitter.com/" 
                  className="hover:text-white"
                  target="_blank"  
                  rel="noopener noreferrer"
                  >
                    
                  </Link>
                </li>
                <li>
                  <Link 
                  href="https://www.instagram.com/" 
                  className="hover:text-white"
                  target="_blank"  
                  rel="noopener noreferrer"
                  >
                    Instagram
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-zinc-800 pt-8 text-center text-sm text-gray-400">
            © 2025 GymSync. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

