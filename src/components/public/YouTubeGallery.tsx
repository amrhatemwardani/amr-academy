'use client'

import { useState } from 'react'
import { Play, Youtube, ExternalLink } from 'lucide-react'

interface VideoItem {
  id: string
  titleEn: string
  titleAr: string
  category: 'explanation' | 'problems' | 'revision'
  grade: string
  duration: string
  youtubeId: string
}

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: '1',
    titleEn: 'Physics & Math Lecture with Eng. Amr Hatem',
    titleAr: 'محاضرة متميزة في الفيزياء وحل المسائل — م. عمرو حاتم',
    category: 'explanation',
    grade: 'الصف الثالث الثانوي',
    duration: 'شرح تفصيلي',
    youtubeId: 'hhTkgPlYPfE',
  },
  {
    id: '2',
    titleEn: 'Advanced Problem Solving Session — Eng. Amr Hatem',
    titleAr: 'حل وتدريبات أفكار الامتحانات المتقدمة — م. عمرو حاتم',
    category: 'problems',
    grade: 'الثانوية العامة',
    duration: 'أفكار امتحانات',
    youtubeId: '-6xFwKza5dk',
  },
  {
    id: '3',
    titleEn: 'Comprehensive Lesson & Concepts Breakdown',
    titleAr: 'تفكيك وتبسيط أصعب القوانين والمعادلات خطوة بخطوة',
    category: 'explanation',
    grade: 'الصف الثاني الثانوي',
    duration: 'شرح وتبسيط',
    youtubeId: 'TkZO8T6BfkI',
  },
  {
    id: '4',
    titleEn: 'Revision & Key Exam Strategies — Eng. Amr Hatem',
    titleAr: 'مراجعة شاملة وأهم التريكات الفيزيائية والرياضية',
    category: 'revision',
    grade: 'الصف الثالث الثانوي',
    duration: 'مراجعة نهائية',
    youtubeId: 'irhtA-PGk1E',
  },
  {
    id: '5',
    titleEn: 'Interactive Classroom & Practical Concepts',
    titleAr: 'شرح تفاعلي وتطبيقات فيزيائية واقعية مع م. عمرو حاتم',
    category: 'explanation',
    grade: 'الصف الأول الثانوي',
    duration: 'تطبيقات عملية',
    youtubeId: 'bzClk54yF_Y',
  },
]

export function YouTubeGallery({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Grid of 5 YouTube Videos with Real Thumbnails */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_VIDEOS.map((video) => {
          const isPlaying = activeVideoId === video.id
          const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`

          return (
            <div
              key={video.id}
              className="rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:border-foreground/20 transition-all flex flex-col"
            >
              {/* Video Thumbnail / In-Place Player */}
              <div className="relative aspect-video w-full bg-black overflow-hidden">
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
                    className="group relative w-full h-full flex items-center justify-center cursor-pointer text-start overflow-hidden"
                    aria-label={`Play ${isAr ? video.titleAr : video.titleEn}`}
                  >
                    {/* REAL YouTube High-Quality Thumbnail Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl}
                      alt={isAr ? video.titleAr : video.titleEn}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />

                    {/* YouTube Red Play Button Badge */}
                    <div className="relative z-10 h-12 w-12 rounded-full bg-red-600/90 group-hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                      <Play className="h-5 w-5 fill-white ms-0.5" />
                    </div>

                    {/* Duration badge */}
                    <span className="absolute bottom-2 end-2 z-10 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-mono text-white">
                      {video.duration}
                    </span>

                    {/* Grade badge */}
                    <span className="absolute top-2 start-2 z-10 rounded bg-background/90 border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                      {video.grade}
                    </span>
                  </button>
                )}
              </div>

              {/* Title & Channel Link */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-2">
                  {isAr ? video.titleAr : video.titleEn}
                </h3>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                    <Youtube className="h-3.5 w-3.5 shrink-0" />
                    <span>م. عمرو حاتم</span>
                  </span>
                  <a
                    href={`https://youtu.be/${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    <span>{isAr ? 'مشاهدة على YouTube' : 'Open'}</span>
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
