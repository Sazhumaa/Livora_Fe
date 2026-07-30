import HeroSection from '../component/landingPage/hero'
import EventPrevSection from '../component/landingPage/eventPreview'

export default function LandingPage() {
  return(
    <div className="min-h-screen bg-white text-black">
      <div className="w-full flex flex-col">
        <HeroSection />
        <EventPrevSection />
      </div>
    </div>
  )
}