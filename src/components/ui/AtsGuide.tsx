import { useState } from "react";

const ATS_TIPS = [
  {
    title: "از عناوین استاندارد بخش‌ها استفاده کنید",
    tip: "به عناوینی مانند «سوابق کاری»، «تحصیلات»، «مهارت‌ها» پایبند باشید. از عناوین خلاقانه یا غیرمعمول پرهیز کنید.",
  },
  {
    title: "از تصاویر و نمودارها پرهیز کنید",
    tip: "سیستم‌های ATS قادر به خواندن تصاویر، جداول یا گرافیک نیستند. تمام محتوا را به صورت متن ساده نگه دارید.",
  },
  {
    title: "کلمات کلیدی آگهی شغلی را منعکس کنید",
    tip: "کلمات و عبارات دقیق آگهی شغلی را به صورت طبیعی در رزومه خود بگنجانید.",
  },
  {
    title: "از عناوین شغلی واضح استفاده کنید",
    tip: "به جای اصطلاحات داخلی شرکت، از عناوین قابل شناسایی و استاندارد صنعت استفاده کنید.",
  },
  {
    title: "دستاوردها را کمّی کنید",
    tip: "نتایج قابل اندازه‌گیری شامل درصدها، مبالغ، اندازه تیم و زمان صرفه‌جویی‌شده را ذکر کنید.",
  },
  {
    title: "از فرمت تاریخ یکسان استفاده کنید",
    tip: "یک فرمت انتخاب کنید (مثلاً «فروردین ۱۴۰۱ – اکنون») و در کل رزومه از آن استفاده کنید.",
  },
  {
    title: "از عناصر تزئینی پرهیز کنید",
    tip: "از سرصفحه/پاصفحه، کادرهای متنی، ستون‌ها، آیکون‌ها و کاراکترهای خاص صرف‌نظر کنید.",
  },
  {
    title: "اطلاعات تماس را خوانا نگه دارید",
    tip: "نام، شماره تماس و ایمیل را در بالای صفحه به صورت متن ساده قرار دهید — نه در سرصفحه یا پاصفحه.",
  },
  {
    title: "مختصر و مفید بنویسید",
    tip: "رزومه را در ۱ تا ۲ صفحه نگه دارید. موارد غیرمرتبط یا قدیمی را حذف کنید.",
  },
];

export function AtsGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="print:hidden" dir="rtl">
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="ats-guide-panel fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-lg shadow-lg transition-colors hover:bg-gray-50"
        title={isOpen ? "بستن راهنمای ATS" : "نمایش راهنمای ATS"}
        aria-label={isOpen ? "بستن راهنمای ATS" : "نمایش راهنمای ATS"}
      >
        {isOpen ? "✕" : "📋"}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="ats-guide-panel fixed right-4 top-16 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl md:w-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">راهنمای بهینه‌سازی ATS</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="mr-2 hidden text-xs text-gray-400 hover:text-gray-600 md:inline"
            >
              بستن
            </button>
          </div>
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto pl-1 md:max-h-[70vh]">
            {ATS_TIPS.map((item, i) => (
              <li key={i} className="text-xs leading-relaxed text-gray-600">
                <span className="mb-0.5 block font-semibold text-gray-800">
                  {item.title}
                </span>
                {item.tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}