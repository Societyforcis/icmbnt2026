import { useState, useEffect, memo } from 'react';
import { Calendar,  AlertCircle, CalendarIcon, FileText } from 'lucide-react';

// Define the structure for deadline data
interface Deadline {
  name: string;
  date: Date;
  icon: React.ReactNode;
  description: string;
  status: 'passed' | 'today' | 'upcoming';
}

const RegistrationCountdown = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{days: number, hours: number, minutes: number, seconds: number}>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [nextDeadline, setNextDeadline] = useState<Deadline | null>(null);

  // This effect should ONLY run once on mount
  useEffect(() => {
    // Define important dates - aligned with Timeline.tsx
    const initialDeadlines: Deadline[] = [
      {
        name: 'Manuscript Submission Deadline',
        date: new Date('2026-04-15T23:59:59'), // Updated date
        icon: <FileText className="text-blue-600" />,
        description: 'Last date for submitting your research papers (Extended)',
        status: 'upcoming'
      },
      {
        name: 'Acceptance Notification',
        date: new Date('2026-04-05T23:59:59'),
        icon: <AlertCircle className="text-purple-600" />,
        description: 'Authors will be notified about acceptance',
        status: 'upcoming'
      },
      {
        name: 'Registration Deadline',
        date: new Date('2026-04-20T23:59:59'), // Updated date
        icon: <CalendarIcon className="text-yellow-600" />,
        description: 'Last date for conference registration (Extended)',
        status: 'upcoming'
      },
      {
        name: 'Conference Dates',
        date: new Date('2026-04-26T09:00:00'),
        icon: <Calendar className="text-red-600" />,
        description: 'ICMBNT-2026 Conference (April 26-27)',
        status: 'upcoming'
      }
    ];
    
    // Update status of each deadline
    const now = new Date();
    const updatedDeadlines = initialDeadlines.map(deadline => {
      const deadlineDate = new Date(deadline.date);
      const isToday = 
        deadlineDate.getDate() === now.getDate() &&
        deadlineDate.getMonth() === now.getMonth() &&
        deadlineDate.getFullYear() === now.getFullYear();
      
      const isPassed = deadlineDate < now && !isToday;
      
      return {
        ...deadline,
        status: (isPassed ? 'passed' : isToday ? 'today' : 'upcoming') as 'passed' | 'today' | 'upcoming'
      };
    });
    
    setDeadlines(updatedDeadlines);
    
    // Find the next upcoming deadline
    const upcomingDeadlines = updatedDeadlines.filter(d => d.status === 'upcoming');
    if (upcomingDeadlines.length > 0) {
      // Sort by date and get the closest one
      upcomingDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
      setNextDeadline(upcomingDeadlines[0]);
    }
  }, []); // Empty dependency array ensures this runs ONCE on mount

  // Update countdown timer - this is the only effect that should run regularly
  useEffect(() => {
    if (!nextDeadline) return;
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const difference = nextDeadline.date.getTime() - now.getTime();
      
      if (difference <= 0) {
        // Deadline has passed
        setTimeRemaining({days: 0, hours: 0, minutes: 0, seconds: 0});
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeRemaining({days, hours, minutes, seconds});
    };
    
    // Initial calculation
    calculateTimeRemaining();
    
    // Set up interval for countdown
    const intervalId = setInterval(calculateTimeRemaining, 1000);
    
    // Clean up interval
    return () => clearInterval(intervalId);
  }, [nextDeadline]); // Only depends on nextDeadline

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-[#F5A051] text-white p-4">
        <h2 className="text-lg font-semibold">Important Dates</h2>
      </div>
      
      <div className="p-4">
        {nextDeadline && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center">
              Next Deadline: <span className="text-blue-800 ml-1">{nextDeadline.name}</span>
            </h3>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center text-blue-800 mb-2">
                {nextDeadline.icon}
                <span className="ml-2 font-medium">{new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).format(nextDeadline.date)}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-white p-2 rounded text-center shadow-sm">
                  <div className="text-xl font-bold text-blue-800">{timeRemaining.days}</div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
                <div className="bg-white p-2 rounded text-center shadow-sm">
                  <div className="text-xl font-bold text-blue-800">{timeRemaining.hours}</div>
                  <div className="text-xs text-gray-500">Hours</div>
                </div>
                <div className="bg-white p-2 rounded text-center shadow-sm">
                  <div className="text-xl font-bold text-blue-800">{timeRemaining.minutes}</div>
                  <div className="text-xs text-gray-500">Minutes</div>
                </div>
                <div className="bg-white p-2 rounded text-center shadow-sm">
                  <div className="text-xl font-bold text-blue-800">{timeRemaining.seconds}</div>
                  <div className="text-xs text-gray-500">Seconds</div>
                </div>
              </div>
              
              <p className="text-sm text-blue-700">{nextDeadline.description}</p>
            </div>
          </div>
        )}
        
        <h3 className="font-medium text-gray-700 mb-2">All Important Dates:</h3>
        <ul className="space-y-2">
          {deadlines.map((deadline, index) => (
            <li key={index} className={`flex items-center text-sm ${
              deadline.status === 'passed' ? 'text-gray-500' : 
              deadline.status === 'today' ? 'text-blue-800 font-medium' : 
              'text-gray-700'
            }`}>
              <div className="mr-2">
                {deadline.icon}
              </div>
              <div>
                <span className="font-medium">{deadline.name}:</span>{' '}
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }).format(deadline.date)}
                {deadline.status === 'passed' && <span className="ml-1 text-gray-500">(Passed)</span>}
                {deadline.status === 'today' && <span className="ml-1 text-red-500 font-bold">(Today)</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(RegistrationCountdown);