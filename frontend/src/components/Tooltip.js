import React, { useState, useEffect, useRef } from 'react';
import './Tooltip.css';

const Tooltip = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    // Détecter si on est sur mobile
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Fermer le tooltip si on clique ailleurs sur mobile
    if (isMobile && isVisible) {
      const handleClickOutside = (event) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
            triggerRef.current && !triggerRef.current.contains(event.target)) {
          setIsVisible(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible, isMobile]);

  const handleInteraction = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsVisible(!isVisible);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isVisible) {
      setIsVisible(false);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsVisible(!isVisible);
    }
  };

  return (
    <span className={`tooltip-container ${position === 'bottom' ? 'tooltip-bottom' : ''}`}>
      <span
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Afficher plus d'informations"
        aria-expanded={isVisible}
      >
        {children}
        <span className="tooltip-icon" aria-hidden="true">ⓘ</span>
      </span>
      {isVisible && (
        <>
          <div
            className="tooltip-backdrop"
            onClick={() => setIsVisible(false)}
          />
          <div
            ref={tooltipRef}
            className="tooltip-content"
            role="tooltip"
            aria-live="polite"
          >
            {text}
          </div>
        </>
      )}
    </span>
  );
};

export default Tooltip;