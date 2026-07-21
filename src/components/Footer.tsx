import React from 'react';
import { ShieldAlert, Award, ShieldCheck, HeartPulse, Sparkles, MapPin, PhoneCall, Mail } from 'lucide-react';
import { ASSURX_CENTERS } from '../data';
import logoImg from '../../logo.jpeg';

interface FooterProps {
  onNavigate: (tab: 'home' | 'scans' | 'labs' | 'packages' | 'hiring' | 'admin' | 'bookings' | 'privacy-policy' | 'terms-of-use' | 'refund-policy' | 'shipping-policy' | 'about-us' | 'contact-us') => void;
  centers?: Array<{ city: string; address: string; phone: string }>;
}

export default function Footer({ onNavigate, centers = [] }: FooterProps) {
  const displayCenters = centers.length > 0 ? centers : ASSURX_CENTERS;
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs md:text-sm border-t border-slate-800" id="main-footer">
      
      {/* Brand Trust Bar */}
      <div className="bg-slate-950 border-b border-slate-900 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">NABL Accredited</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Labs fully audited to ISO 15189 standards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">MD Radiologists</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Dual-verified reporting of all scan results</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">2 Crore+ Patients</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Most trusted name in diagnostics & scans</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#AD1457] flex-shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">Robotic Accuracy</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Minimal human contact for sterile precision</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Col 1: About - md:col-span-4 */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => onNavigate('home')}>
            <img src={logoImg} alt="AssurX Diagnostics" className="h-10 w-auto rounded-lg object-contain bg-white/10 px-1.5 py-0.5" />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            AssurX Scans & Labs is India’s premier diagnostics and advanced medical imaging network. Bridging clinical expertise with futuristic diagnostic technology, we make high-end MRI, CT scans, and complete laboratory blood analyses affordable and accessible for every citizen.
          </p>
          <div className="space-y-2 text-[11px]">
            <a href="tel:+919830678387" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <PhoneCall className="w-3.5 h-3.5 text-[#009688]" />
              <span className="text-[#80CBC4] font-bold">Helpline: +91 9830678387</span>
            </a>
            <a
              href="https://wa.me/919830678387?text=Hello%20AssurX%20Diagnostics!%20I%20want%20to%20book%20a%20test%20😊"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white font-bold hover:text-emerald-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp Us: 9830678387 😊</span>
            </a>
            <a href="mailto:assurxdiagonistics@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-[#009688]" />
              <span className="text-[#80CBC4]">Care: assurxdiagonistics@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Col 2: Services Index - md:col-span-2.5 */}
        <div className="md:col-span-2.5 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Imaging & Scans</h4>
          <ul className="space-y-2 text-[11px]">
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">1.5T / 3T Brain MRI</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">High-speed CT Scans</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">Pregnancy Ultrasound</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">Digital Chest X-Ray</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">Bilateral Mammography</button></li>
            <li><button onClick={() => onNavigate('scans')} className="hover:text-white hover:underline transition-colors cursor-pointer">ECG & 2D Echo cardiac</button></li>
          </ul>
        </div>

        {/* Col 3: Lab Tests Index - md:col-span-2.5 */}
        <div className="md:col-span-2.5 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Laboratory Diagnostics</h4>
          <ul className="space-y-2 text-[11px]">
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Complete Blood Count (CBC)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Thyroid Profiles (T3, T4, TSH)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Diabetes Glycated HbA1c</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Cardiovascular Lipid Panel</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Liver Function Tests (LFT)</button></li>
            <li><button onClick={() => onNavigate('labs')} className="hover:text-white hover:underline transition-colors cursor-pointer">Vitamin D & B12 screening</button></li>
          </ul>
        </div>

        {/* Col 4: Top Centers - md:col-span-3 */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Top Mumbai Branches</h4>
          <div className="space-y-2 text-[11px] max-h-48 overflow-y-auto pr-1 text-slate-400">
            {displayCenters.map((center, idx) => (
              <div key={idx} className="border-b border-slate-800/60 pb-1.5 last:border-b-0 last:pb-0">
                <span className="font-bold text-slate-300 block">{center.city} Branch</span>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{center.address}</p>
                <span className="text-[10px] text-[#009688] font-semibold block mt-0.5">Ph: {center.phone}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Copywrite legal info footer */}
      <div className="bg-slate-950 text-slate-550 border-t border-slate-900 py-6 px-4 md:px-6 text-[10px] md:text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 AssurX Scans & Laboratories Pvt. Ltd. All medical rights reserved.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2">
            <button onClick={() => onNavigate('about-us')} className="hover:text-slate-300 transition-colors cursor-pointer">About Us</button>
            <button onClick={() => onNavigate('contact-us')} className="hover:text-slate-300 transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => onNavigate('privacy-policy')} className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => onNavigate('terms-of-use')} className="hover:text-slate-300 transition-colors cursor-pointer font-semibold">Terms of Use</button>
            <button onClick={() => onNavigate('refund-policy')} className="hover:text-slate-300 transition-colors cursor-pointer">Cancellation & Refund</button>
            <button onClick={() => onNavigate('shipping-policy')} className="hover:text-slate-300 transition-colors cursor-pointer">Service Delivery</button>
          </div>
        </div>
      </div>

    </footer>
  );
}
