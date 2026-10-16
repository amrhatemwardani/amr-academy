'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Youtube, ExternalLink, Sparkles, Filter } from 'lucide-react'

interface VideoItem {
  id: string
  titleEn: string
  titleAr: string
  category: 'explanation' | 'problems' | 'revision'
  grade: string
  duration: string
  youtubeId: string
  featured?: boolean
}

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: '1',
    titleEn: 'Physics Sec 3: Electric Current & Ohm’s Law Deep Dive',
    titleAr: 'فيزياء ٣ ث: شرح التيار الكهربي وقانون أوم وتوصيل المقاومات',
    category: 'explanation',
    grade: 'Sec 3',
    duration: '42:15',
    youtubeId: 'dQw4w9WgXcQ', // fallback/placeholder ID that renders thumbnail
    featured: true,
  },
  {
    id: '2',
    titleEn: 'Pure Math Sec 3: Calculus — Differentiation Techniques',
    titleAr: 'رياضيات بحتة ٣ ث: التفاضل والتكامل — قواعد الاشتقاق المتقدمة',
    category: 'problems',
    grade: 'Sec 3',
    duration: '35:20',
    youtubeId: 'dQw4w9WgXcQ',
    featured: true,
  },
  {
    id: '3',
    titleEn: 'Physics Sec 2: Wave Motion & Light Reflection/Refraction',
    titleAr: 'فيزياء ٢ ث: الحركة الموجية وانعكاس وانكسار الضوء بالمسائل',
    category: 'explanation',
    grade: 'Sec 2',
    duration: '28:40',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: '4',
    titleEn: 'Applied Math: Statics — Equilibrium of Rigid Bodies',
    titleAr: 'رياضيات تطبيقية: استاتيكا — اتزان الجسم الجاسئ والعزوم',
    category: 'revision',
    grade: 'Sec 3',
    duration: '50:10',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: '5',
    titleEn: 'Physics Sec 1: Motion in a Straight Line & Newton’s Laws',
    titleAr: 'فيزياء ١ ث: معادلات الحركة في خط مستقيم وقوانين نيوتن',
    category: 'explanation',
    grade: 'Sec 1',
    duration: '31:05',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: '6',
    titleEn: 'Physics Exam Revision: Top 50 Tricky Questions Solved',
    titleAr: 'ليلة الامتحان فيزياء: حل أصعب ٥٠ مسألة متوقعة مع الشرح',
    category: 'revision',
    grade: 'Sec 3',
    duration: '1:12:00',
    youtubeId: 'dQw4w9WgXcQ',
  },
]

export function YouTubeGallery({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  const categories = [
    { key: 'all', labelEn: 'All Videos', labelAr: 'جميع الفيديوهات' },
    { key: 'explanation', labelEn: 'Explanations', labelAr: 'شروحات الدروس' },
    { key: 'problems', labelEn: 'Problem Solving', labelAr: 'حل المسائل والتدريبات' },
    { key: 'revision', labelEn: 'Final Revisions', labelAr: 'المراجعات النهائية' },
  ]

  const filteredVideos = selectedCategory === 'all'
    ? SAMPLE_VIDEOS
    : SAMPLE_VIDEOS.filter((v) => v.category === selectedCategory)

  return (
    <div className="space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Category Pills & Channel Subscribe CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === c.key
                  ? 'bg-[#F2B134] text-[#0F2A4A] shadow-md shadow-[#F2B134]/20 scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              {isAr ? c.labelAr : c.labelEn}
            </button>
          ))}
        </div>

        {/* Subscribe Button */}
        <a
          href="https://www.youtube.com/@Eng.AmrHatem?sub_confirmation=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105"
        >
          <Youtube className="h-4 w-4" />
          <span>{isAr ? 'اشترك في القناة مجاناً' : 'Subscribe to Channel'}</span>
        </a>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => {
          const isPlaying = activeVideoId === video.id

          return (
            <div
              key={video.id}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden shadow-lg transition-all hover:border-[#F2B134]/40 hover:-translate-y-1 flex flex-col"
            >
              {/* Video Thumbnail / Lazy Player */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                    title={isAr ? video.titleAr : video.titleEn}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(video.id)}
                    className="group relative w-full h-full flex items-center justify-center cursor-pointer text-start"
                    aria-label={`Play ${isAr ? video.titleAr : video.titleEn}`}
                  >
                    {/* Simulated High-Res Video Thumbnail */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-[#0F2A4A] flex items-center justify-center">
                      <div className="p-4 text-center opacity-70">
                        <Youtube className="h-12 w-12 text-red-500 mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                        <p className="text-[11px] font-mono text-slate-300">@Eng.AmrHatem</p>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="relative z-20 h-14 w-14 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-transform group-hover:scale-110">
                      <Play className="h-6 w-6 fill-white ms-0.5" />
                    </div>

                    {/* Duration badge */}
                    <span className="absolute bottom-2 end-2 z-20 rounded bg-black/80 px-2 py-0.5 text-[11px] font-mono font-semibold text-white">
                      {video.duration}
                    </span>

                    {/* Grade badge */}
                    <span className="absolute top-2 start-2 z-20 rounded-md bg-[#0F2A4A]/90 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-[#F2B134]">
                      {video.grade}
                    </span>
                  </button>
                )}
              </div>

              {/* Video Title & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                    {isAr ? video.titleAr : video.titleEn}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300 text-[11px]">
                    {video.category === 'explanation' && (isAr ? 'شرح نظري وتطبيقي' : 'Lesson Theory')}
                    {video.category === 'problems' && (isAr ? 'حل أفكار ومسائل' : 'Solved Exercises')}
                    {video.category === 'revision' && (isAr ? 'مراجعة امتحانات' : 'Exam Preparation')}
                  </span>
                  <a
                    href="https://www.youtube.com/@Eng.AmrHatem"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#F2B134] hover:underline font-semibold text-[11px]"
                  >
                    <span>{isAr ? 'مشاهدة على يوتيوب' : 'Open in YouTube'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
