interface PinInput {
  designator: string;
  name: string;
  description?: string;
}

const detectType = (name: string): string => {
  const upper = name.toUpperCase();
  if (/(VIN|VDD|VCC|VBAT|GND|EP|PAD|AVDD|PVIN|PGND|AGND)/.test(upper)) return 'Power';
  if (/(EN|FB|SENSE|RESET|CLKIN|ADC)/.test(upper)) return 'Input';
  if (/(OUT|SW|LX|CLKOUT|LED_OUT)/.test(upper)) return 'Output';
  if (/(GPIO|SDA|SCL|DQ)/.test(upper)) return 'I/O';
  if (/OPEN\s*DRAIN|OPEN\s*COLLECTOR/.test(upper)) return 'Open Collector';
  if (/OPEN\s*EMITTER/.test(upper)) return 'Open Emitter';
  if (/NC|DNC/.test(upper)) return 'Passive';
  return 'Passive';
};

const detectSide = (name: string): 'Left' | 'Right' => {
  const upper = name.toUpperCase();
  if (/(OUT|SW|LX|CLKOUT|GPIO|SDA|SCL|DQ)/.test(upper)) return 'Right';
  return 'Left';
};

export const buildPinTsv = (pins: PinInput[]): string => {
  const header = 'Designator\tName\tElectrical Type\tSide\tDescription';
  const rows = pins.map((pin) => {
    const type = detectType(pin.name);
    const side = detectSide(pin.name);
    return `${pin.designator}\t${pin.name}\t${type}\t${side}\t${pin.description ?? ''}`;
  });
  return [header, ...rows].join('\n');
};
