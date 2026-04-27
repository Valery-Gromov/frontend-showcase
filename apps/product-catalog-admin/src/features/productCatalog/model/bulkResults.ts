import type { BulkActionResult, BulkActionState, BulkFailure } from './types';

type CompletedBulkActionState = Exclude<BulkActionState, { status: 'idle' } | { status: 'submitting' }>;

export function getBulkResultState(result: BulkActionResult): CompletedBulkActionState {
  if (result.failed.length === 0) {
    return {
      status: 'success',
      message: `Bulk action completed. ${result.success.length} succeeded.`,
    };
  }

  if (result.success.length > 0) {
    return {
      status: 'partialSuccess',
      message: `Partial success: ${result.success.length} succeeded, ${result.failed.length} failed.`,
      failed: result.failed,
    };
  }

  return {
    status: 'failure',
    message: `Bulk action failed. ${result.failed.length} failed.`,
  };
}

export function getFailureDetails(result: BulkActionResult): BulkFailure[] {
  return result.failed;
}
