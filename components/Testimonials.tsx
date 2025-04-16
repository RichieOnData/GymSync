const testimonials = [
  {
    name: "Sarah L.",
    role: "Fitness Enthusiast",
    content:
      "GymSync's AI recommendations have transformed my workout routine. I've seen incredible progress in just a few months!",
  },
  {
    name: "Mike T.",
    role: "Gym Owner",
    content:
      "The admin analytics have been a game-changer for our gym. We've optimized our equipment and improved member retention significantly.",
  },
  {
    name: "Emily R.",
    role: "Nutrition Coach",
    content:
      "The AI meal planning feature is incredibly accurate. It's made my job easier and my clients are seeing better results.",
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-black dark:bg-black">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-black dark:bg-gray-900 p-6 rounded-2xl shadow-lg">
              <p className="text-white dark:text-red-400 mb-4 italic">"{testimonial.content}"</p>
              <div className="font-semibold text-red-500 dark:text-red-400">{testimonial.name}</div>
              <div className="text-sm text-white dark:text-gray-400">{testimonial.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

