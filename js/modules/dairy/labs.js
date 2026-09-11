// These are optional explanatory models, not operational farm/food-safety controls.
export const WORLD_LABS = {
  farm: {
    launchLabel: 'Cow comfort demo',
    model: 'comfort', rule: 'toggle', labels: ['WATER'], title: 'Make a comfortable cow corner', kicker: 'THE COMFORT CORNER', lesson: 'cowcare',
    intro: 'Try the water, shade, and fan. Watch each change in the demonstration pen.',
    actions: ['Fill clean water', 'Add shade', 'Turn on airflow'],
    notes: ['The trough fills. Clean drinking water is part of daily cow care.',
      'The canopy opens. Shade gives cows shelter from the sun.',
      'The fan turns. Airflow can help cows stay comfortable. Cooling tools vary by farm.'],
    finish: 'Water, shade, and airflow work together. Farmers also check feed, bedding, and cow health every day.'
  },
  processor: {
    launchLabel: 'Milk line demo',
    model: 'line', rule: 'sequence', labels: ['CHECK', 'HEAT', 'COOL'], retry: 'Follow the line in order: receiving checks, pasteurization, then cooling and packaging.', title: 'Follow a batch of drinking milk', kicker: 'THE MILK LINE', lesson: 'receiving',
    intro: 'Start with receiving checks. Then follow this simplified milk line from heating to cooling.',
    actions: ['Receive & check', 'Pasteurize', 'Chill & package'],
    notes: ['Receiving checks come first. Milk is sampled and checked before acceptance.',
      'The heating section lights up. Pasteurization uses controlled heat to reduce harmful bacteria.',
      'The cooling section turns blue and cartons appear. Refrigerated milk stays cold through delivery.'],
    finish: 'Checks → controlled heating → cooling and packaging. This model shows the idea, not operating temperatures or a complete plant process.'
  },
  market: {
    launchLabel: 'Package delivery demo',
    model: 'delivery', rule: 'sequence', labels: ['GROCERY', 'KITCHEN', 'REFRIGERATED DELIVERY'], retry: 'Look at the package size: a household carton goes to the grocery; a bulk case goes to foodservice.', title: 'Send the right package', kicker: 'THE DELIVERY TABLE', lesson: 'foodservice',
    intro: 'A household milk carton is ready. Which buyer is it packed for?',
    actions: ['Grocery household order', 'Restaurant bulk order'],
    notes: ['The carton reaches the grocery case. Next: send the large foodservice cheese case.',
      'The bulk cheese case reaches the restaurant. Different buyers need different package sizes.'],
    finish: 'One dairy story, two destinations. Keep these refrigerated products cold on both routes.'
  }
};

