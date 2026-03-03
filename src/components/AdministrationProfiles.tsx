import React from "react";
import { ShieldCheck } from "lucide-react";
import principalImg from "@/assets/administration/principal.png";
import deenImg from "@/assets/administration/hostel_deen.png";
import boysWarden1Img from "@/assets/administration/boys_warden_1.png";
import boysWarden2Img from "@/assets/administration/boys_warden_2.png";
import girlsWarden1Img from "@/assets/administration/girls_warden_1.png";
import girlsWarden2Img from "@/assets/administration/girls_warden_2.png";

const profiles = [
    {
        name: "Dr. K. Sundeep Kumar",
        role: "College Principal",
        image: principalImg,
        description: "Geethanjali Institute of Science & Technology",
    },
    {
        name: "Prof. P. Murali Krishna",
        role: "Hostel Dean",
        image: deenImg,
        description: "In-charge of Hostel Administration",
    },
    {
        name: "Mr. R. Vijay",
        role: "Boys Hostel Warden",
        image: boysWarden1Img,
        description: "Block-A & B Oversight",
    },
    {
        name: "Mr. S. Ramesh",
        role: "Boys Hostel Warden",
        image: boysWarden2Img,
        description: "Block-C & D Oversight",
    },
    {
        name: "Mrs. M. Lakshmi",
        role: "Girls Hostel Warden",
        image: girlsWarden1Img,
        description: "Main Block Oversight",
    },
    {
        name: "Mrs. K. Sarada",
        role: "Girls Hostel Warden",
        image: girlsWarden2Img,
        description: "Annex Block Oversight",
    },
];

const AdministrationProfiles = () => {
    return (
        <section className="py-12 bg-transparent overflow-hidden">
            <div className="container mx-auto px-4 mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-black italic text-primary inline-flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-primary/30"></div>
                    KEY ADMINISTRATION
                    <div className="h-[2px] w-8 bg-primary/30"></div>
                </h2>
                <p className="text-muted-foreground font-semibold mt-2 max-w-2xl mx-auto uppercase tracking-tighter brightness-150">
                    Leading excellence in student life and discipline
                </p>
            </div>

            <div className="relative group">
                {/* Gradients for smooth edges */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

                {/* Scrolling Container */}
                <div className="overflow-x-auto md:overflow-x-hidden no-scrollbar pb-8">
                    <div className="flex animate-scroll-slow w-max gap-6 px-4">
                        {[...profiles, ...profiles, ...profiles, ...profiles].map((profile, index) => (
                            <div
                                key={`${profile.name}-${index}`}
                                className="flex-shrink-0 w-64 group/card"
                            >
                                <div className="relative bg-card/60 backdrop-blur-md rounded-3xl border border-primary/10 p-4 shadow-xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden hover:-translate-y-2">
                                    {/* Background Decor */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover/card:bg-primary/10 transition-colors"></div>

                                    {/* Image Container */}
                                    <div className="relative mb-4 mx-auto w-32 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-lg rotate-1 group-hover/card:rotate-0 transition-transform duration-500">
                                        <img
                                            src={profile.image}
                                            alt={profile.name}
                                            className="w-full h-full object-cover transform scale-105 group-hover/card:scale-100 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-foreground leading-tight mb-1 group-hover/card:text-primary transition-colors">
                                            {profile.name}
                                        </h3>
                                        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2 border border-primary/5">
                                            {profile.role}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                                            "{profile.description}"
                                        </p>
                                    </div>

                                    {/* Professional Stamp */}
                                    <div className="absolute bottom-2 right-2 opacity-5 group-hover/card:opacity-10 transition-opacity">
                                        <ShieldCheck className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};


export default AdministrationProfiles;
