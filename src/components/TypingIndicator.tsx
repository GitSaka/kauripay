"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-slate-50 border border-slate-150 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 shadow-3xs">
        {/* Les 3 petits points qui sautent comme sur WhatsApp */}
        <div className="w-1.5 h-1.5 bg-[#4EBA93] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-[#4EBA93] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-[#4EBA93] rounded-full animate-bounce" />
      </div>
    </div>
  );
}
