/**
 * Format a Date object to YYYY-MM-DD
 */
export const formatDateStr = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get standard Date input bounds based on user role
 * - SUPER_ADMIN: Unrestricted history (minDate: null), maxDate: Today (unless allowFuture is true)
 * - MAIN_MANAGER & MANAGER_2: minDate: 45 days ago, maxDate: Today (unless allowFuture is true)
 * - CHEF: allowFuture is usually true for requirements
 *
 * @param {Object} user Authenticated user object with role
 * @param {Boolean} [allowFuture=false] Whether future dates are permitted
 * @returns {{ minDate: string|null, maxDate: string|null }}
 */
export const getDateInputLimits = (user, allowFuture = false) => {
  const todayStr = formatDateStr(new Date());

  const limits = {
    minDate: null,
    maxDate: allowFuture ? null : todayStr,
  };

  if (user?.role === 'MAIN_MANAGER' || user?.role === 'MANAGER_2') {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    limits.minDate = formatDateStr(fortyFiveDaysAgo);
  }

  return limits;
};

export default {
  formatDateStr,
  getDateInputLimits,
};
