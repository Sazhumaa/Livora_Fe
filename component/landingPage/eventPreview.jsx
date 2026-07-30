import Image from 'next/image'
import eventPoster from '../../public/EventPoster.jpg'

const dummyData = [
    { id: 1, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
    { id: 2, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
    { id: 3, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
    { id: 4, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
    { id: 5, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
    { id: 6, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
    { id: 7, imgUrl: eventPoster, eventName: "Yoasobi Event Consert", date: "17 Jan 2026", organizer: "Yoasobi", price: 1500000 },
]

export default function eventPreview() {
    return(
        <div className='min-h-screen px-12 md:px-24 lg:px-38 py-2 md:py-8'>
            <div className='flex flex-row justify-between items-center'>
                <div className='flex flex-col '>
                    <h1 className='text-4xl font-bold'>
                        Event Terpopuler Saat Ini
                    </h1>
                    
                    <p className='leading-tight mt-1 md:mt-2 text-sm md:text-lg'>
                        Temukan event yang sedang ramai diminati dan jangan sampai kehabisan tiket.
                    </p>
                    
                </div>
                
                <div className='flex h-10'>
                    <button className='text-white bg-black rounded-lg px-4 font-semibold'>
                        Lihat Semua 
                    </button>
                </div>
            </div>
            
            <div className='flex'>
                {dummyData.map(d => {
                    return(
                        <div
                            key={d.id}
                            className='w-full flex text-black gap-3'
                        >
                            <div className=''>
                                <Image
                                    src={d.imgUrl || null}
                                    alt={d.eventName}
                                    width={64}
                                    height={64}
                                    className='w-full rounded-xl'
                                />
                                <div className='flex flex-col'>
                                    <h1>
                                        {d.eventName}
                                    </h1>
                                    <p>
                                        {d.date}
                                    </p>
                                    <p>
                                        {d.organizer}
                                    </p>
                                    <p>
                                        {d.price}
                                    </p>
                                </div>                                
                            </div>
                            
                        </div>  
                    )
                })}    
            </div>
        </div>
    )
}