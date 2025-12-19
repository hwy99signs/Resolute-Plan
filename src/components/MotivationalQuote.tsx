import { useState, useEffect } from 'react';
import { Sparkles, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function MotivationalQuote() {
  const { t } = useTranslation();
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Get all quotes using translations
  const getQuotes = () => {
    return [
      { text: t('notificationsFeed.quote1'), author: t('notificationsFeed.quote1Author') },
      { text: t('notificationsFeed.quote2'), author: t('notificationsFeed.quote2Author') },
      { text: t('notificationsFeed.quote3'), author: t('notificationsFeed.quote3Author') },
      { text: t('notificationsFeed.quote4'), author: t('notificationsFeed.quote4Author') },
      { text: t('notificationsFeed.quote5'), author: t('notificationsFeed.quote5Author') },
      { text: t('notificationsFeed.quote6'), author: t('notificationsFeed.quote6Author') },
      { text: t('notificationsFeed.quote7'), author: t('notificationsFeed.quote7Author') },
      { text: t('notificationsFeed.quote8'), author: t('notificationsFeed.quote8Author') },
      { text: t('notificationsFeed.quote9'), author: t('notificationsFeed.quote9Author') },
      { text: t('notificationsFeed.quote10'), author: t('notificationsFeed.quote10Author') },
      { text: t('notificationsFeed.quote11'), author: t('notificationsFeed.quote11Author') },
      { text: t('notificationsFeed.quote12'), author: t('notificationsFeed.quote12Author') },
      { text: t('notificationsFeed.quote13'), author: t('notificationsFeed.quote13Author') },
      { text: t('notificationsFeed.quote14'), author: t('notificationsFeed.quote14Author') },
      { text: t('notificationsFeed.quote15'), author: t('notificationsFeed.quote15Author') },
      { text: t('notificationsFeed.quote16'), author: t('notificationsFeed.quote16Author') },
      { text: t('notificationsFeed.quote17'), author: t('notificationsFeed.quote17Author') },
      { text: t('notificationsFeed.quote18'), author: t('notificationsFeed.quote18Author') },
      { text: t('notificationsFeed.quote19'), author: t('notificationsFeed.quote19Author') },
      { text: t('notificationsFeed.quote20'), author: t('notificationsFeed.quote20Author') },
    ];
  };

  useEffect(() => {
    const quotes = getQuotes();
    // Set a random quote on mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuoteIndex(randomIndex);

    // Change quote daily
    const lastQuoteDate = localStorage.getItem('lastQuoteDate');
    const today = new Date().toDateString();
    
    if (lastQuoteDate !== today) {
      const newIndex = Math.floor(Math.random() * quotes.length);
      setQuoteIndex(newIndex);
      localStorage.setItem('lastQuoteDate', today);
    }
  }, [t]);

  const quotes = getQuotes();
  const quote = quotes[quoteIndex] || quotes[0];

  return (
    <div className="relative group">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
      
      <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-10 -translate-x-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
              <Quote className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-xs opacity-90 tracking-wide uppercase">{t('notificationsFeed.dailyMotivationLabel', { defaultValue: 'Daily Motivation' })}</span>
              </div>
              <p className="text-sm leading-relaxed mb-3 italic">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-xs opacity-90">— {quote.author}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
