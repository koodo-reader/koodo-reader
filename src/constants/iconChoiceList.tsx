import iconArial from 'src/assets/icons/arial.png';
import iconVerdana from 'src/assets/icons/verdana.png';

export const iconChoiceList = [
  {
    id: 1,
    title: "Font family",
    value: "fontFamily",
    option: [
      {
        value: "Arial",
        src: iconArial,
        alt: "Police Arial",
        onClick: () => alert('Image 3 cliquée!'),
        className: "border"
      },
      {
        value: "Verdana",
        src: iconVerdana,
        alt: "Police Verdana",
        onClick: () => alert('Image 3 cliquée!'),
        className: "border"
      }
    ],
  },
  {
    id: 2,
    title: "Line height",
    value: "lineHeight",
    option: ["Default", "1", "1.25", "1.5", "1.75", "2"],
  },
  {
    id: 3,
    title: "Text alignment",
    value: "textAlign",
    option: ["Default", "Left", "Right"],
  }
]

const clickableImages = [
  {
    props: {
      src: "https://via.placeholder.com/150",
      alt: "Image 1",
      onClick: () => alert('Image 1 cliquée!'),
      className: "rounded-md"
    }
  },
  {
    props: {
      src: "https://via.placeholder.com/100",
      alt: "Image 2",
      onClick: () => alert('Image 2 cliquée!'),
      className: "rounded-full"
    }
  },
  {
    
  }
];