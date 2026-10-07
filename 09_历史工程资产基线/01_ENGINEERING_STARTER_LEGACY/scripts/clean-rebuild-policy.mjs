export function assertCleanRebuildEnvironment(value) {
  if (value !== 'development' && value !== 'test') {
    throw new Error('CLEAN_REBUILD_REFUSED: APP_ENV must be development or test');
  }
  return value;
}
