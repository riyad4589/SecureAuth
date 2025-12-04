import { useEffect } from 'react';

/**
 * Hook pour définir le titre de la page dynamiquement
 * @param {string} pageTitle - Le titre de la page actuelle
 */
const usePageTitle = (pageTitle) => {
  useEffect(() => {
    const baseTitle = 'SecureAuth+';
    document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle;
    
    // Remettre le titre par défaut quand on quitte la page
    return () => {
      document.title = baseTitle;
    };
  }, [pageTitle]);
};

export default usePageTitle;
