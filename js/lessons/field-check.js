// Attachment is presentation only. Mode changes never require changing item IDs.
export function fieldCheckItems(items) {
  return items.filter(item => item.mode !== 'fact' || !items.some(target => target.id === item.attachedTo && target.mode === 'quiz'));
}
export function attachedFacts(items, questionId) {
  return items.filter(item => item.mode === 'fact' && item.attachedTo === questionId);
}
