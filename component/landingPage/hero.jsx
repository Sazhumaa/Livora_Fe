import appleInstall from '../../public/cta1.png'
import googleInstall from '../../public/cta2.png'
import HeroImage from '../../public/TesAssets1.webp'

import Image from 'next/image'

export default function Hero() {
    return(
        <div className="w-full min-h-screen justify-center items-center flex px-12 md:px-24 lg:px-38">
            <div className="w-full flex justify-between items-center">
                <div className="flex flex-col gap-2 md:gap-4">
                    <h1 className="text-2xl md:text-6xl font-bold">
                        Temukan pengalaman <br />
                        tak terlupakan.
                    </h1>
                    
                    <p className="leading-tight text-sm md:text-lg  md:mt-2">
                        Jelajahi berbagai event menarik, pesan tiket dengan mudah, <br />
                        dan hadir di momen yang akan selalu kamu kenang.
                    </p>
                    
                    <div className="flex flex-row gap-4 mt-2">
                        <div className='flex'>
                            <Image 
                                src={googleInstall}
                                alt='google'
                                width={148}
                                height={148}
                            />
                        </div>
                        <div className='flex '>
                            <Image 
                                src={appleInstall}
                                alt='google'
                                width={148}
                                height={148}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex md:w-xs">
                    <Image 
                        src={HeroImage}
                        alt='google'
                        width={248}
                        height={248}
                        className='w-full'
                    />
                </div>
            </div>
        </div>
    )
}