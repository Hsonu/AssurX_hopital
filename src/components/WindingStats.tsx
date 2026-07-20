import React from 'react';
import { Users, HeartPulse, Building2, Stethoscope, Landmark, Sparkles } from 'lucide-react';

export default function WindingStats() {
  const stats = [
    {
      id: 1,
      value: '28.8M+',
      label: 'Total No. of Customers',
      icon: Users,
      side: 'right', // Content is on the right, circle is on the left
    },
    {
      id: 2,
      value: '~5,000',
      label: 'Total No. of Test and Panels',
      icon: HeartPulse,
      side: 'left', // Content is on the left, circle is on the right
    },
    {
      id: 4,
      value: '12,300+',
      label: 'Pick-up Points',
      icon: Stethoscope,
      side: 'right', // Content is on the right, circle is on the left
    }
  ];

  return (
    <section className="relative overflow-hidden bg-white py-20 px-4 md:px-6 border-b border-slate-100" id="winding-stats-section">
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-16 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F0FA] border border-[#E8DEFF] rounded-full text-[#2D006B] text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#AD1457]" />
          <span>India's Largest Diagnostic Network</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-slate-900 tracking-tight">
          Unmatched Scale. <span className="italic font-medium text-[#AD1457]">Uncompromised Care.</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto">
          Through absolute precision, high-volume robotic laboratories, and widespread access points, we deliver health assurance to millions.
        </p>
      </div>

      <div className="max-w-xl mx-auto relative px-4 md:px-0">
        
        {/* SERPENTINE SVG BACKGROUND PATH - Responsive connecting road */}
        {/* On desktop/tablet, this draws a beautiful wavy serpentine road in the background */}
        <div className="absolute inset-0 z-0 pointer-events-none hidden sm:block">
          <svg className="w-full h-full stroke-[#B2DFDB]" fill="none" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 400 600" preserveAspectRatio="none">
            {/* Smooth curvy path from circle to circle */}
            <path d="
              M 110,95 
              C 250,95 310,210 290,285
              C 270,360 150,420 110,475
              C 90,500 200,560 200,600
            " />
          </svg>
        </div>

        {/* Fallback road for mobile screens */}
        <div className="absolute left-[36px] sm:left-auto sm:right-auto sm:inset-x-0 top-16 bottom-16 w-3 sm:hidden bg-[#009688] rounded-full pointer-events-none z-0"></div>

        {/* List of Alternating Stats Nodes */}
        <div className="space-y-16 sm:space-y-24 relative z-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            
            return (
              <div 
                key={stat.id} 
                className={`flex flex-col sm:flex-row items-center gap-6 sm:gap-0 relative ${
                  stat.side === 'left' ? 'sm:flex-row-reverse' : ''
                }`}
              >
                
                {/* THE CIRCLE ACCENT BLOCK */}
                {/* On mobile, aligned to the left for a linear flow. On desktop, structured back and forth */}
                <div className="w-full sm:w-1/2 flex justify-start sm:justify-center">
                  <div className="relative flex items-center justify-center pl-4 sm:pl-0">
                    
                    {/* Ring layers matching the yellow glow from screenshot */}
                    <div className="w-24 h-24 rounded-full bg-white border-[6px] border-[#009688] flex items-center justify-center shadow-xl relative z-10 hover:scale-105 transition-transform duration-300">
                      {/* Inner concentric band */}
                      <div className="absolute inset-2 rounded-full bg-[#E0F2F1] flex items-center justify-center">
                        <Icon className="w-10 h-10 text-[#00796B] stroke-[1.5]" />
                      </div>
                    </div>

                    {/* Small pulsing connecting dots */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-4 w-3.5 h-3.5 rounded-full bg-[#009688] border-2 border-white shadow-md z-20 hidden sm:block"></div>
                  </div>
                </div>

                {/* THE TEXT METRIC CONTENT BLOCK */}
                <div className={`w-full sm:w-1/2 text-left pl-12 sm:pl-0 ${
                  stat.side === 'left' ? 'sm:text-right sm:pr-12' : 'sm:pl-12'
                }`}>
                  <div className="space-y-1">
                    <span className="block text-4xl md:text-5xl font-serif italic font-bold text-slate-950 tracking-tight leading-none">
                      {stat.value}
                    </span>
                    <span className="block text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {stat.label}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
