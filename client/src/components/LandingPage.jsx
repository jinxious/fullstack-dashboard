import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, FileSpreadsheet, AlertCircle, Shield, 
  Cpu, BarChart, Server, Globe, Lock, ShieldCheck, 
  ArrowRight, ChevronRight, Layout, Loader2 
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const { setDataset, setUploading, setUploadError, isUploading, uploadError, setStep } = useDashboardStore();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDataset(response.data.data, response.data.schema, response.data.filename);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Error parsing file. Ensure it is a valid CSV or Excel.');
    } finally {
      setUploading(false);
    }
  }, [setDataset, setUploading, setUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a', fontFamily: "'Inter', sans-serif", color: '#ffffff' }}>
      
      {/* ── NAV ── */}
      <nav style={{ borderBottom: '1px solid #1a1a1a' }} className="flex items-center justify-between px-10 py-5 sticky top-0 bg-[#0a0a0a/80] backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Georgia', serif", fontSize: '20px', letterSpacing: '0.15em', fontWeight: 700 }}>
            METRICSFLOW
          </span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          {['PLATFORM', 'FEATURES', 'ENTERPRISE', 'PRICING'].map(item => (
            <a key={item} href="#" style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#888', fontWeight: 500 }}
              className="hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
        <button
          style={{ fontSize: '11px', letterSpacing: '0.15em', border: '1px solid #333', padding: '10px 24px', borderRadius: '4px', color: '#eee', fontWeight: 500 }}
          className="hover:border-white hover:text-white transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          DASHBOARD →
        </button>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-10 py-24 gap-16 max-w-7xl mx-auto w-full">
        <div className="flex-1 space-y-8">
          <h1 style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 6vw, 84px)',
            lineHeight: '1.1',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}>
            Data, refined<br />into <span className="italic">clarity.</span>
          </h1>
          <p className="text-xl text-[#888] max-w-lg leading-relaxed">
            Transform raw datasets into structured dashboards—instantly, intelligently, and without complexity. 
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="bg-white text-black px-8 py-4 rounded-md font-bold text-sm tracking-widest hover:bg-[#e0e0e0] transition-colors shadow-2xl shadow-white/5">
              GET STARTED
            </button>
            <button className="border border-[#333] text-white px-8 py-4 rounded-md font-bold text-sm tracking-widest hover:border-white transition-colors">
              EXPLORE DEMO
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[480px]">
          <div 
            {...getRootProps()}
            className={`relative p-8 rounded-xl border-2 border-dashed transition-all duration-300 group
              ${isDragActive ? 'border-white bg-white/5' : 'border-[#222] bg-[#111] hover:border-[#444]'}`}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-white mb-6" />
                <p className="text-lg font-medium tracking-tight">Refining Data...</p>
                <p className="text-sm text-[#555] mt-2">Analyzing schema and distributions.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="mb-6 p-4 rounded-full bg-white/5 border border-[#222] group-hover:border-[#444] transition-colors">
                  <UploadCloud className="w-10 h-10 text-[#666] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-medium mb-2 tracking-tight">Upload Dataset</h3>
                <p className="text-[#555] mb-8 text-center text-sm leading-relaxed">
                  Drag & drop your CSV or Excel file here<br />to instantly generate your dashboard.
                </p>
                <div className="flex items-center gap-3 bg-[#1a1a1a] px-5 py-2.5 rounded-lg border border-[#222]">
                  <FileSpreadsheet className="w-4 h-4 text-[#888]" />
                  <span className="text-xs font-medium text-[#888] tracking-widest uppercase">.CSV, .XLSX, .XLS</span>
                </div>
              </div>
            )}

            {/* Shield Badge */}
            <div className="absolute -bottom-4 -left-4 bg-[#0a0a0a] border border-[#222] px-3 py-1.5 rounded-md flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#555]">SHIELD SECURE. NO DATA STORED.</span>
            </div>
          </div>
          
          {uploadError && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-lg text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{uploadError}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }} className="py-24">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { 
              id: '01', 
              title: 'Automated Analysis', 
              desc: 'Our engine instantly detects schemas, data types, and logical relationships within your file.',
              icon: Cpu
            },
            { 
              id: '02', 
              title: 'Real-Time Insights', 
              desc: 'Changes in your filters and parameters reflect instantly across the entire dashboard interface.',
              icon: BarChart
            },
            { 
              id: '03', 
              title: 'Data Integrity', 
              desc: 'MetricsFlow operates entirely in-memory for temporary sessions, ensuring absolute data privacy.',
              icon: Lock
            }
          ].map((f, i) => (
            <div key={f.id} className="space-y-6 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.2em] text-[#333] group-hover:text-white transition-colors">{f.id}</span>
                <f.icon className="w-5 h-5 text-[#333] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold tracking-widest uppercase">{f.title}</h3>
              <p className="text-sm text-[#555] leading-relaxed italic" style={{ fontFamily: "'Georgia', serif" }}>
                "{f.desc}"
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICE CARDS ── */}
      <section className="py-32 px-10">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 style={{ fontFamily: "'Georgia', serif", fontSize: '48px', fontWeight: 400, letterSpacing: '-0.01em' }}>
              Built for accuracy.
            </h2>
            <p className="text-[#555] max-w-md text-sm leading-relaxed tracking-wide">
              We've engineered MetricsFlow to handle complexity so you don't have to. Every component is optimized for precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Automated Logic', desc: 'Advanced processing ensures consistent and structured outputs every time.', icon: Layout },
              { title: 'Smart Systems', desc: 'Adaptive models refine results based on your unique data patterns.', icon: Server },
              { title: 'Scalable Workflows', desc: 'From small datasets to large-scale analysis, handled effortlessly.', icon: Globe }
            ].map(card => (
              <div key={card.title} className="p-8 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#333] transition-all group">
                <card.icon className="w-8 h-8 text-[#444] mb-8 group-hover:text-white transition-colors" />
                <h4 className="text-sm font-bold tracking-widest uppercase mb-4">{card.title}</h4>
                <p className="text-sm text-[#555] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERFACE MOCKUP SECTION ── */}
      <section className="pt-20 pb-32 px-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-4 md:p-8 lg:p-12 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-white text-black text-[10px] font-black tracking-[0.3em] uppercase rounded-full flex items-center justify-center leading-none">
              Native Interface
            </div>
            <div className="aspect-[16/9] bg-[#0a0a0a] rounded-2xl border border-[#222] shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden relative">
               {/* Simplified Mockup representation */}
               <div className="absolute inset-0 p-6 flex flex-col gap-6 opacity-40 grayscale">
                 <div className="h-12 w-full bg-[#111] rounded-lg border border-[#222]" />
                 <div className="flex-1 flex gap-6">
                   <div className="w-1/4 h-full bg-[#111] rounded-lg border border-[#222]" />
                   <div className="flex-1 grid grid-cols-2 gap-6">
                     <div className="bg-[#111] rounded-lg border border-[#222]" />
                     <div className="bg-[#111] rounded-lg border border-[#222]" />
                     <div className="bg-[#111] rounded-lg border border-[#222] col-span-2" />
                   </div>
                 </div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center z-10">
                 <div className="text-center space-y-4 px-6">
                   <h3 style={{ fontFamily: "'Georgia', serif", fontSize: '32px' }}>Clarity at any scale.</h3>
                   <p className="text-[10px] tracking-[0.25em] text-[#888] font-bold uppercase">Experience the Precision of MetricsFlow</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '80px 40px 40px' }} className="mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2 space-y-6">
              <span style={{ fontFamily: "'Georgia', serif", fontSize: '18px', letterSpacing: '0.15em', fontWeight: 700 }}>
                METRICSFLOW
              </span>
              <p className="text-[#555] text-sm max-w-xs leading-relaxed">
                The intelligent analytics platform for teams that demand precision and speed.
              </p>
            </div>
            {[
              { title: 'DOCS / API', links: ['Documentation', 'API Reference', 'Integrations'] },
              { title: 'PRIVACY / TERMS', links: ['Privacy Policy', 'Terms of Service', 'Security'] },
              { title: 'SOCIAL', links: ['Twitter / X', 'GitHub', 'LinkedIn'] }
            ].map(col => (
              <div key={col.title} className="space-y-6">
                <h5 className="text-[10px] font-black tracking-[0.2em] text-[#333] uppercase">{col.title}</h5>
                <ul className="space-y-4">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs text-[#555] hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-[#111]">
            <span className="text-[10px] font-bold tracking-[0.1em] text-[#333]">© 2024 METRICSFLOW INC.</span>
            <div className="flex items-center gap-8">
               <span className="text-[10px] font-bold tracking-[0.2em] text-[#222] hover:text-[#444] cursor-pointer transition-colors uppercase">System Status: Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Dev bypass icon */}
      <button 
        onClick={() => setStep(3)} 
        className="fixed bottom-6 right-6 p-3 bg-white/5 border border-[#222] rounded-full hover:border-[#444] transition-all group"
        title="Bypass to Builder"
      >
        <Layout className="w-4 h-4 text-[#444] group-hover:text-white" />
      </button>
    </div>
  );
}
