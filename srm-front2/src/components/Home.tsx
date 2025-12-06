"use client"

import { Calendar, MapPin, Users, Target, Compass, Globe } from "lucide-react"
import { useState, useEffect } from "react"
import bali from "./images/bali.png"
import con from "./images/bali/u.png"
import society from "./images/bali/society.png"
import isius from "./images/bali/isius.png"
import Timeline from "./Timeline"

// Sponsor logos - placeholder imports (replace with actual logo paths)
import udayanaLogo from "./images/bali/ul.png" // TODO: Replace with Udayana University logo
import srmLogo from "./images/bali/srm2.png" // TODO: Replace with SRM University logo
import pelitaBangsaLogo from "./images/bali/pelita.png" // TODO: Replace with Universitas Pelita Bangsa logo

const Home = () => {
  const [showLogos, setShowLogos] = useState(false)

  useEffect(() => {
    // Check screen size on mount and on resize
    const checkScreenSize = () => {
      setShowLogos(window.innerWidth > 1500)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <div className="relative min-h-screen text-white overflow-hidden bg-gradient-to-r from-blue-900 to-[#F5A051] text-white">

        <div className="absolute inset-0 backdrop-blur-md bg-black/20"></div>

        <div className="relative z-10 container mx-auto px-4 py-12 min-h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-2xl md:text-5xl font-bold mb-6 leading-tight max-w-5xl ">
            International Conference on Multidisciplinary Breakthroughs and NextGen Technologies
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-[#F5A051] drop-shadow-md">(ICMBNT–2026)</h2>
          {/* <p className="text-2xl md:text-4xl mb-4 text-black drop-shadow-md font-bold animate-pulse">2nd International Conference</p> */}

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-12">
            <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 animate-bounce">
              <Calendar className="w-10 h-10 mr-2 text-[#F5A051]" />
              <span>March 12 & 13, 2026</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 animate-bounce">
              <MapPin className="w-10 h-10 mr-2 text-[#F5A051]" />
              <span>Bali, Indonesia</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 animate-bounce">
              <Users className="w-10 h-10 mr-2 text-[#F5A051]" />
              <span>Hybrid Conference (In-person + Virtual)</span>
            </div>
          </div>

          {/* Left Logo - ISIUS - Show only on screens > 1500px */}
          {showLogos && (
            <div className="absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 z-20">
              <div className="flex flex-col items-center ml-[-100px] mt-[-300px]">
                <img
                  src={isius}
                  alt="ICSCS Logo"
                  className="h-28 xl:h-32 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
                <p className="text-sm text-slate-300 mt-2 font-semibold text-center max-w-[150px]">International Society of Intelligent Unmanned Systems</p>
                <p className="text-xs text-slate-400 mt-1">(ICSCS)</p>
              </div>
            </div>
          )}

          {/* Right Logo - Society - Show only on screens > 1500px */}
          {showLogos && (
            <div className="absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-20">
              <div className="flex flex-col items-center mt-[-300px] ml-[100px]">
                <img
                  src={society}
                  alt="Society CIS Logo"
                  className="h-40 xl:h-48 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
                <p className="text-sm text-slate-300 mt-2 font-semibold text-center max-w-[150px]">Society for Cyber Intelligent Systems</p>
                <p className="text-xs text-slate-400 mt-1">Puducherry – India</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs text-slate-300 mb-2">Organized by</p>
            <p className="text-sm text-white mb-1">
              <span className="font-bold">Society for Cyber Intelligent Systems</span> <span className="text-slate-300">(Puducherry – India)</span>
              <span className="mx-2">&</span>
              <span className="font-bold">International Society of Intelligent Unmanned Systems</span> <span className="text-slate-300">(South Korea - Jimbaran Bali)</span>
            </p>
          </div>

          {/* Sponsor Logos Section - Above Register Button */}
          <div className="mb-8 w-full max-w-4xl">
            <p className="text-sm text-slate-300 mb-6 font-semibold uppercase tracking-wider">Sponsored By</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 md:gap-16 px-6 py-4">
              {/* Udayana University Logo */}
              <div className="flex flex-col items-center">
                <img
                  src={udayanaLogo}
                  alt="Udayana University, Bali, Indonesia"
                  className="h-16 sm:h-20 md:h-24 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <p className="text-xs sm:text-sm text-white mt-3 text-center font-medium max-w-[140px]">
                  Udayana University
                </p>
              </div>

              {/* SRM University Logo */}
              <div className="flex flex-col items-center">
                <img
                  src={srmLogo}
                  alt="SRM University"
                  className="h-16 sm:h-20 md:h-24 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <p className="text-xs sm:text-sm text-white mt-3 text-center font-medium max-w-[140px]">
                  SRM University
                </p>
              </div>

              {/* Universitas Pelita Bangsa Logo */}
              <div className="flex flex-col items-center">
                <img
                  src={pelitaBangsaLogo}
                  alt="Universitas Pelita Bangsa"
                  className="h-16 sm:h-20 md:h-24 object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <p className="text-xs sm:text-sm text-white mt-3 text-center font-medium max-w-[140px]">
                  Universitas Pelita Bangsa
                </p>
              </div>
            </div>
          </div>

          {/* Register Button - Now in center */}
          <button className="bg-[#F5A051] hover:bg-[#e08c3e] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 text-lg inline-block shadow-lg shadow-[#F5A051]/30 hover:shadow-[#F5A051]/40 hover:scale-105">
            REGISTER NOW
          </button>
        </div>


        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>


      <section id="conference-venue" className="py-16 bg-white scroll-mt-20 relative">
        <div className="relative z-10 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-[#F5A051]">Conference Venue</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={bali}
                  alt="Bali Resort - Conference Venue"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">BALI</h3>
                  <p className="text-[#F5A051]">Bali, Indonesia</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={con}
                  alt="Conference Venue"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">Conference Venue</h3>
                  <p className="text-[#F5A051]">Bali, Indonesia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-16 h-16 bg-[#F5A051]/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-[#F5A051]" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 text-center">
              Society for <span className="text-[#F5A051]">Cyber Intelligent Systems</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="p-8 rounded-2xl bg-white shadow-lg border border-[#F5A051]/10 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#F5A051]/10 rounded-xl flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-[#F5A051]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Vision</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The Vision of the society is to be a global leader in advancing cybersecurity and intelligent systems by
                fostering innovation, research, and collaboration, ensuring a secure and resilient digital future for
                all.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white shadow-lg border border-[#F5A051]/10 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#F5A051]/10 rounded-xl flex items-center justify-center mr-4">
                  <Compass className="w-6 h-6 text-[#F5A051]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Mission</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The primary mission is to advance cybersecurity and intelligent systems by promoting cutting-edge
                technologies like AI and machine learning, fostering research in cyber intelligence, and enhancing
                threat detection and mitigation strategies. We are committed to organizing training programs, workshops,
                and awareness campaigns to educate professionals and the public on best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="w-16 h-16 bg-[#F5A051]/10 rounded-full flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-[#F5A051]" />
            </div>
            <h2 className="text-3xl font-bold text-center">
              SCOPE OF THE <span className="text-[#F5A051]">CONFERENCE</span>
            </h2>
          </div>

          <div className="bg-gray-50 p-8 rounded-2xl border border-[#F5A051]/20">
            <p className="text-gray-700 leading-relaxed mb-4">
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies (ICMBNT 2026) is
              designed to integrate perspectives from Science, Technology, Medical and Healthcare, Management, social
              sciences, Education, sports and environmental studies to develop holistic solutions for global issues.
            </p>

            <p className="text-gray-700 leading-relaxed mb-4">
              Also in a rapidly evolving digital-first business world, global organizations are highly influenced by
              next generation technologies. Future technological advancements, developments, and innovations enabled by
              the internet, software, and services are known as next generation technologies. These include advanced
              robotics, AI, IoT, RPA, quantum computing, 3-D printing, 5G wireless networks, virtual reality and
              augmented reality, and blockchain.
            </p>

            <p className="text-gray-700 leading-relaxed">
              ICMBNT 2026 will be a central hub for esteemed Research experts worldwide and can anticipate unparalleled
              opportunities to network, gain invaluable insights, showcase their hidden potential, present significant
              research findings, receive due credit and recognition for their contributions.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <Timeline />

      <footer className="py-8 bg-white border-t border-gray-200 text-gray-600 text-center">
        <p>© 2026 ICMBNT. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Home
