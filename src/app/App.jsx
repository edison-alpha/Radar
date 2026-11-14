import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { StatusBar } from '../layout/StatusBar';
import { MobileNav } from '../layout/MobileNav';
import { Hero } from '../features/radar/Hero';
import { RadarSection } from '../features/radar/RadarSection';
import { useRadarFilters } from '../features/radar/useRadarFilters';
import { ProtocolPage } from '../features/protocol/ProtocolPage';
import { MethodologyPage } from '../features/methodology/MethodologyPage';
import { MonitorPage } from '../features/monitor/MonitorPage';
import { SavedPage } from '../features/saved/SavedPage';
import { Toast } from '../components/ui/Toast';
import { useSavedProtocols } from '../shared/useSavedProtocols';
import { protocolHref, useRoute } from '../shared/useRoute';
import { useRecent } from '../shared/useRecent';

export function App({ data }) {
  const { saved, toggle, storageError } = useSavedProtocols();
  const filters = useRadarFilters(data, saved);
  const route = useRoute();
  const pendingScroll = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { recent, push: pushRecent, clear: clearRecent } = useRecent();
  const protocol = useMemo(
    () => (route.name === 'protocol' ? data.rows.find((p) => p.slug === route.slug) : null),
    [route, data.rows],
  );

  const toggleWithToast = useCallback(
    (slug) => {
      const name = data.rows.find((p) => p.slug === slug)?.name ?? 'Protocol';
      const wasSaved = saved.has(slug);
      toggle(slug);
      setToast({
        id: Date.now(),
        message: wasSaved ? `Removed ${name} from your list` : `Saved ${name} to your list`,
        action: wasSaved ? null : { label: 'View list', href: '#/saved' },
      });
    },
    [data.rows, saved, toggle],
  );

  const goHome = useCallback((event) => {
    event?.preventDefault();
    window.location.hash = '';
  }, []);
  const openMethodology = useCallback(() => {
    window.location.hash = '#/methodology';
  }, []);
  const openProtocol = useCallback(
    (p) => {
      pushRecent(p.slug);
      window.location.hash = protocolHref(p.slug);
    },
    [pushRecent],
  );

  useEffect(() => {
    function onKey(event) {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if (
        event.key === '/' && !typing && !event.isComposing &&
        !event.ctrlKey && !event.metaKey && !event.altKey
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    if (route.name === 'home' && route.scroll) {
      document.getElementById('protocols')?.scrollIntoView({ behavior: 'instant' });
    }
  }, [route]);

  useEffect(() => {
    if (route.name === 'home' && pendingScroll.current) {
      pendingScroll.current = false;
      document.getElementById('protocols')?.scrollIntoView({ behavior: 'instant' });
    }
  }, [route.name]);

  const topCategories = useMemo(() => {
    const counts = new Map();
    for (const row of data.rows)
      if (row.category) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1));
  }, [data.rows]);
  function openCategory(name) {
    filters.changeView('all');
    filters.setCategory(name);
    if (route.name !== 'home') {
      pendingScroll.current = true;
      window.location.hash = '';
    } else {
      document.getElementById('protocols')?.scrollIntoView({ behavior: 'instant' });
    }
  }

  function navigate(view) {
    if (view === 'monitor') {
      window.location.hash = '#/radar';
      return;
    }
    if (view === 'saved') {
      window.location.hash = '#/saved';
      return;
    }
    filters.changeView(view);
    if (route.name !== 'home') {
      pendingScroll.current = true;
      window.location.hash = '';
    } else {
      document.getElementById('protocols')?.scrollIntoView({ behavior: 'instant' });
    }
  }

  return (
    <>
      <a className="skip-link" href="#protocols">
        Skip to protocols
      </a>
      <Header
        view={
          route.name === 'saved' || route.name === 'monitor'
            ? route.name
            : route.name === 'home'
              ? filters.view
              : ''
        }
        onView={navigate}
        savedCount={filters.counts.saved}
        onMethodology={openMethodology}
        search={{
          open: searchOpen,
          onOpenChange: setSearchOpen,
          rows: data.rows,
          categories: topCategories,
          recent,
          onClearRecent: clearRecent,
          onSelect: openProtocol,
          onCategory: openCategory,
        }}
      />
      {route.name === 'home' && <Hero data={data} onMethodology={openMethodology} />}
      <main className="page-container">
        <motion.div
          key={`${route.name}-${route.slug ?? ''}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {route.name === 'home' && (
            <>
              {storageError && (
                <p className="storage-notice" role="status">
                  Bookmarks are saved for this session only. Browser storage is unavailable.
                </p>
              )}
              <RadarSection
                data={data}
                filters={filters}
                saved={saved}
                onToggleSave={toggleWithToast}
                onSelect={openProtocol}
                onMethodology={openMethodology}
              />
            </>
          )}
          {route.name === 'protocol' && (
            <ProtocolPage
              protocol={protocol}
              asOf={data.as_of}
              suggestions={data.rows.slice(0, 6)}
              onSelect={openProtocol}
              onSearch={() => setSearchOpen(true)}
              onBack={goHome}
              saved={saved}
              onToggleSave={toggleWithToast}
            />
          )}
          {route.name === 'monitor' && (
            <MonitorPage
              onMethodology={openMethodology}
              data={data}
              saved={saved}
              onToggleSave={toggleWithToast}
              onSelect={openProtocol}
              onBack={goHome}
            />
          )}
          {route.name === 'saved' && (
            <SavedPage
              data={data}
              saved={saved}
              onToggleSave={toggleWithToast}
              onSelect={openProtocol}
              onBack={goHome}
            />
          )}
          {route.name === 'methodology' && (
            <MethodologyPage data={data} onBack={goHome} onSelect={openProtocol} />
          )}
        </motion.div>
        <Toast toast={toast} onDismiss={() => setToast(null)} />
        <Footer
          onExplore={() => navigate('all')}
          onSaved={() => navigate('saved')}
          onMethodology={openMethodology}
        />
      </main>
      <StatusBar data={data} />
      {!searchOpen && (
        <MobileNav
          route={route.name}
          onExplore={() => navigate('all')}
          onRadar={() => navigate('monitor')}
          onMethodology={openMethodology}
        />
      )}
    </>
  );
}
