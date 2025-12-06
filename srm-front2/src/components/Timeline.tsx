import { Calendar } from "lucide-react";
// Only import if installed
try {
  require('animate.css');
} catch (e) {
  console.warn("animate.css not found, animations will be disabled");
}

const timelineData = [
  {
    date: "5 January 2026",
    title: "Manuscript Submission Deadline",
    description: "Last date to submit your research papers and manuscripts"
  },
  {
    date: "25 January 2026",
    title: "Acceptance Notification",
    description: "Authors will be notified about the acceptance of their papers"
  },
  {
    date: "5 February 2026",
    title: "Registration Deadline",
    description: "Last date for conference registration"
  },
  {
    date: "12-13 March 2026",
    title: "Conference Dates",
    description: "Main conference days"
  }
];

const Timeline = () => {
  return (
    <div className="flex flex-col items-center w-full py-10 bg-white">
      <h2 className="text-2xl font-bold text-center mb-8 text-[#F5A051]">Important Dates</h2>
      <div className="relative w-full max-w-2xl">
        {/* Vertical line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>

        {/* Timeline items */}
        {timelineData.map((item, index) => (
          <div
            key={index}
            className={`relative mb-8 flex items-center w-full ${typeof document !== 'undefined' ? 'animate__animated animate__fadeInUp' : ''
              }`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {index % 2 === 0 ? (
              // Left side item
              <>
                <div className="w-1/2 flex justify-end px-4">
                  <div className="bg-white shadow-lg p-4 rounded-lg w-64 text-left hover:shadow-xl hover:bg-gray-50 hover:-translate-y-1 hover:scale-105 transform transition-all duration-300 group cursor-pointer border border-transparent hover:border-gray-200">
                    <div className="flex items-center text-[#F5A051] font-semibold mb-1 group-hover:text-[#e08c3e]">
                      <Calendar className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                      <span>{item.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-[#F5A051]">{item.title}</h3>
                    <p className="text-gray-600 text-sm group-hover:text-gray-800">{item.description}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#F5A051] rounded-full z-10 hover:scale-150 hover:bg-[#e08c3e] transition-all duration-300"></div>
                </div>
                <div className="w-1/2"></div>
              </>
            ) : (
              // Right side item
              <>
                <div className="w-1/2"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#F5A051] rounded-full z-10 hover:scale-150 hover:bg-[#e08c3e] transition-all duration-300"></div>
                </div>
                <div className="w-1/2 flex justify-start px-4">
                  <div className="bg-white shadow-lg p-4 rounded-lg w-64 text-left hover:shadow-xl hover:bg-gray-50 hover:-translate-y-1 hover:scale-105 transform transition-all duration-300 group cursor-pointer border border-transparent hover:border-gray-200">
                    <div className="flex items-center text-[#F5A051] font-semibold mb-1 group-hover:text-[#e08c3e]">
                      <Calendar className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                      <span>{item.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-[#F5A051]">{item.title}</h3>
                    <p className="text-gray-600 text-sm group-hover:text-gray-800">{item.description}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;