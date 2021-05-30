export function textColor(backgroundColor: string) {
  if(!backgroundColor || 0 === backgroundColor.length) {
    return '#000000';
  } else {
    const input = backgroundColor.toString().replace('#', '');
    if(input.length != 6) {
      return '#000000';
    } else {
      const red = parseInt(input.substr(0,2), 16);
      const green = parseInt(input.substr(2,2), 16);
      const blue = parseInt(input.substr(4,2), 16);
      // Luminance values for different hues are not equal.
      const greyscale = red * 0.299 + green * 0.587 + blue * 0.114;
      // Perceived midpoint for grey is higher than 128. (around 186)
      const midpoint = 152;
      return (greyscale > midpoint) ? '#000000' : '#ffffff';
    }
  }
}
