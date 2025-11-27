"use client"

import { useState } from "react"
import { Users, Globe, Mail, Linkedin, Twitter, Building, MapPin } from "lucide-react"
import PageTransition from './PageTransition';

// Define types for committee members
type MemberRole =
  | "Conference Chair"
  | "Conference Co-Chair"
  | "Organizing Chair"
  | "Technical Program Chair"
  | "Publication Chair"
  | "Publicity Chair"
  | "Local Arrangement Chair"
  | "Advisory Board"
  | "Conference Coordinators"
  | "Committee Members"

interface CommitteeMember {
  id: number
  name: string
  role: MemberRole
  affiliation: string
  country?: string
  designation?: string
  image: string
  links?: {
    email?: string
    website?: string
    linkedin?: string
    twitter?: string
  }
}

// Committee members data - already correctly defined
const committeeMembers: CommitteeMember[] = [
  {
    id: 1,
    name: "Prof. Dr. Azham Hussain",
    role: "Conference Chair",
    affiliation: "School of Computing, Universiti Utara Malaysia",
    country: "Malaysia",
    image: "/placeholder.svg?height=300&width=300",
    designation: "Professor"
  },
  {
    id: 2,
    name: "Dr. S. Sridhar",
    role: "Conference Co-Chair",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 3,
    name: "Dr. K. Ganesh Kumar",
    role: "Conference Co-Chair",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 4,
    name: "Prof. Dr. Vishnu Kumar Kaliappan",
    role: "Conference Co-Chair",
    affiliation: "Department of Computer Science and Engineering, KPR Institute of Engineering and Technology",
    country: "India",
    designation: "Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 5,
    name: "Dr. Manikanthan S.V.",
    role: "Organizing Chair",
    affiliation: "Society for Cyber Intelligent System",
    country: "India",
    designation: "President",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 6,
    name: "Dr. Swetha Indudhar Goudar",
    role: "Technical Program Chair",
    affiliation: "KLS Gogte Institute of Technology, Belagavi",
    country: "India",
    designation: "Professor / Research Dean",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 7,
    name: "Dr. V. Sakthivel",
    role: "Technical Program Chair",
    affiliation: "Vellore Institute of Technology – Chennai Campus",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 8,
    name: "Dr. Shanmugam Ramasamy",
    role: "Technical Program Chair",
    affiliation: "Vellore Institute of Technology, Vellore",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 9,
    name: "Dr. T. Padmapriya",
    role: "Publication Chair",
    affiliation: "Melange Publications",
    country: "India",
    designation: "Managing Director",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 10,
    name: "Dr. T. Karthick",
    role: "Publicity Chair",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 11,
    name: "Dr. R. Jeyaraj",
    role: "Publicity Chair",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 12,
    name: "Mr. Christopher",
    role: "Local Arrangement Chair",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 13,
    name: "Dr. Susana Gómez Martínez",
    role: "Advisory Board",
    affiliation: "Universidad de Valladolid, Campus Universitario Duques de Soria",
    country: "Spain",
    designation: "Faculty",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 14,
    name: "Dr. Sam Goundar",
    role: "Advisory Board",
    affiliation: "RMIT University",
    country: "Vietnam",
    designation: "Senior Lecturer in Information Technology",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 15,
    name: "Ts. Dr. Tan Kian Lam",
    role: "Advisory Board",
    affiliation: "Wawasan Open University",
    country: "Malaysia",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 16,
    name: "Dr. Dugki Min",
    role: "Advisory Board",
    affiliation: "School of Computer Science and Engineering, Konkuk University",
    country: "South Korea",
    designation: "Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 17,
    name: "Dr. Sujit Jagtap",
    role: "Advisory Board",
    affiliation: "University of Illinois at Urbana-Champaign",
    country: "United States",
    designation: "Research Scientist",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 18,
    name: "Dr. Manish K. Tiwari",
    role: "Advisory Board",
    affiliation: "Novonesis",
    country: "Denmark",
    designation: "Senior Scientist",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 19,
    name: "Dr. Sajeesh Kappachery",
    role: "Advisory Board",
    affiliation: "United Arab Emirates University",
    country: "UAE",
    designation: "Postdoctoral Fellow",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 20,
    name: "Dr. K. Mohanasundaram",
    role: "Advisory Board",
    affiliation: "KPR Institute of Engineering and Technology",
    country: "India",
    designation: "Professor and Head",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 21,
    name: "Dr. M. Rajasekar",
    role: "Advisory Board",
    affiliation: "Saveetha School of Engineering, Saveetha University",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 22,
    name: "Dr. A. Murugan",
    role: "Conference Coordinators",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 23,
    name: "Dr. A. Syed Ismail",
    role: "Conference Coordinators",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 24,
    name: "Dr. John Deva Prasanna D S",
    role: "Committee Members",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 25,
    name: "Dr. K. Priyadarshini",
    role: "Committee Members",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 26,
    name: "Dr. J. Jebasonia",
    role: "Committee Members",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 27,
    name: "Dr. Safa",
    role: "Committee Members",
    affiliation: "Department of Networking and Communications, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 28,
    name: "Dr. Rajalakshmi",
    role: "Committee Members",
    affiliation: "Department of Networking and Communications, SRM Institute of Science and Technology",
    country: "India",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 29,
    name: "Dr. P. Saravanan",
    role: "Committee Members",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 30,
    name: "Dr. Lubin Balasubramanian",
    role: "Committee Members",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 31,
    name: "Dr. B. Muruganantham",
    role: "Committee Members",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 32,
    name: "Dr. T.K. Sivakumar",
    role: "Committee Members",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor (Sr.Gr)",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 33,
    name: "Dr. Mukesh Krishnan",
    role: "Committee Members",
    affiliation: "Department of Networking and Communications, SRM Institute of Science and Technology",
    country: "India",
    designation: "Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 34,
    name: "Dr. Saravanan",
    role: "Committee Members",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 35,
    name: "Dr. Kowsigan M",
    role: "Committee Members",
    affiliation: "Department of Computing Technologies, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 36,
    name: "Dr. Fancy C",
    role: "Committee Members",
    affiliation: "Department of Networking and Communications, SRM Institute of Science and Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 37,
    name: "R. Indumathi",
    role: "Committee Members",
    affiliation: "Manakula Vinayagar Institute of Technology",
    country: "India",
    designation: "Assistant Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 38,
    name: "M. Viji",
    role: "Committee Members",
    affiliation: "Manakula Vinayagar Institute of Technology",
    country: "India",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 39,
    name: "Dr. Shobana Devi A",
    role: "Committee Members",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  },
  {
    id: 40,
    name: "Dr. T. Veeramakali",
    role: "Committee Members",
    affiliation: "Department of Data Science and Business Systems, SRM Institute of Science and Technology",
    country: "India",
    designation: "Associate Professor",
    image: "/placeholder.svg?height=300&width=300"
  }
]

// Updated filter options for committee roles
const roleFilters: MemberRole[] = [
  "Conference Chair",
  "Conference Co-Chair",
  "Organizing Chair",
  "Technical Program Chair",
  "Publication Chair",
  "Publicity Chair",
  "Local Arrangement Chair",
  "Advisory Board",
  "Conference Coordinators",
  "Committee Members"
]

const ConferenceCommittee: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>("all")

  // Filter members based on selected role
  const filteredMembers =
    selectedRole === "all" ? committeeMembers : committeeMembers.filter((member) => member.role === selectedRole)

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Committee</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies - ICMBNT 2026
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto max-w-6xl px-4 py-12">
          {/* Committee Description */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Users className="w-8 h-8 text-[#F5A051] mr-3" />
              <h2 className="text-3xl font-bold text-gray-800">Our Committee</h2>
            </div>
            <p className="text-lg text-gray-600 max-w-4xl">
              The organizing committee brings together leading experts from around the world in diverse academic fields. 
              Our members represent top academic institutions and industry organizations committed to fostering 
              innovation and collaboration in multidisciplinary research and education.
            </p>
          </div>

          {/* Role Filter */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter by Role:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRole("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedRole === "all" ? "bg-[#F5A051] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Roles
              </button>
              {roleFilters.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedRole === role ? "bg-[#F5A051] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Committee Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                    <div className="bg-[#F5A051]/20 text-[#F5A051] text-xs font-semibold px-2.5 py-0.5 rounded inline-block mb-1">
                      {member.role}
                    </div>
                    {member.designation && (
                      <p className="text-gray-700 text-sm font-medium">{member.designation}</p>
                    )}
                    <p className="text-gray-600 text-sm flex items-center mt-1">
                      <Building className="w-3 h-3 mr-1" />
                      {member.affiliation}
                    </p>
                    {member.country && (
                      <p className="text-gray-600 text-sm flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {member.country}
                      </p>
                    )}
                  </div>

                  {/* Social Links - Only show if links are provided */}
                  {member.links && Object.keys(member.links).length > 0 && (
                    <div className="mt-4 flex space-x-3">
                      {member.links.email && (
                        <a
                          href={`mailto:${member.links.email}`}
                          className="text-gray-500 hover:text-[#F5A051]"
                          aria-label={`Email ${member.name}`}
                        >
                          <Mail className="w-5 h-5" />
                        </a>
                      )}
                      {member.links.website && (
                        <a
                          href={member.links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-[#F5A051]"
                          aria-label={`${member.name}'s website`}
                        >
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                      {member.links.linkedin && (
                        <a
                          href={member.links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-[#F5A051]"
                          aria-label={`${member.name}'s LinkedIn profile`}
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {member.links.twitter && (
                        <a
                          href={member.links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-[#F5A051]"
                          aria-label={`${member.name}'s Twitter profile`}
                        >
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-[#F5A051]/10 rounded-xl p-8 border border-[#F5A051]/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Contact the Committee</h3>
            <p className="text-gray-600 mb-6">
              For inquiries related to the conference, submissions, or other matters, please reach out to our committee at the email below.
            </p>
            <a
              href="mailto:icmbnt2026@gmail.com"
              className="inline-flex items-center px-6 py-3 bg-[#F5A051] text-white font-medium rounded-lg hover:bg-[#e08c3e] transition-colors"
            >
              icmbnt2026@gmail.com
              <Mail className="ml-2 w-4 h-4" />
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <p className="text-center text-gray-400">
              © {new Date().getFullYear()} International Conference on Multidisciplinary Breakthroughs and NextGen Technologies. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}

export default ConferenceCommittee

