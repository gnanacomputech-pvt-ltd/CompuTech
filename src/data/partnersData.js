import dpiitLogo from '../../resources/logo/dpiit-recognition.jpg';
import mcaLogo from '../../resources/logo/mca-logo.webp';
import suranaCollegeImg from '../../resources/colleges/surana-college-peenya.jpg';
import sjrcCollegeImg from '../../resources/colleges/sjrc-college.webp';
import rcCollegeImg from '../../resources/colleges/rc-college.jpg';

export const partnersData = [
  {
    id: 1,
    name: 'Surana College, Peenya Campus',
    type: 'Academic Partner',
    location: 'Peenya II Stage, Bengaluru - 560022',
    description: 'Established in 2017 under the GDA Foundation, this NAAC \'A\' Grade accredited private institute hosts academic collaboration drives, IT skill seminars, and project mentorship for BCA & B.Com students.',
    studentsImpacted: '900+ Students',
    tag: 'BCA / B.Com Focus',
    image: suranaCollegeImg
  },
  {
    id: 2,
    name: 'Sri Jagadguru Renukacharya College (SJRC)',
    type: 'Institutional Partner',
    location: 'Race Course Road, Bengaluru - 560009',
    description: 'A historic institution established in 1945 under the Veerashaiva Education Society, centrally located in Bengaluru. Collaboration covers final-year projects, IT workshops, and placement readiness programs.',
    studentsImpacted: '1,800+ Students',
    tag: 'Arts / Science / Commerce',
    image: sjrcCollegeImg
  },
  {
    id: 3,
    name: 'Ramnarayan Chellaram College (RC College)',
    type: 'Commerce & Management Partner',
    location: 'Palace Road, Gandhi Nagar, Bengaluru - 560001',
    description: 'A premier public commerce and management institution near Chalukya Circle. Partnership focuses on business IT applications, ERP training, and management project support for BBA & B.Com students.',
    studentsImpacted: '1,400+ Students',
    tag: 'BBA / B.Com Management',
    image: rcCollegeImg
  }
];

export const recognitionsData = [
  {
    title: 'DPIIT Recognized',
    subtitle: 'Ministry of Commerce & Industry',
    description: 'Officially recognized by the Department for Promotion of Industry and Internal Trade (DPIIT), operating under the Ministry of Commerce and Industry in the Government of India.',
    badge: 'Govt. of India Recognized',
    icon: '🇮🇳',
    image: dpiitLogo
  },
  {
    title: 'Ministry of Corporate Affairs (MCA)',
    subtitle: 'CIN: U85500KA2025PTC205651',
    description: 'Incorporated under the Ministry of Corporate Affairs, an Indian government ministry responsible for the regulation of corporate enterprises and administration of laws like the Companies Act.',
    badge: 'MCA Incorporated',
    icon: '🏛️',
    image: mcaLogo
  },
  {
    title: 'University Network Alignment',
    subtitle: 'Industry-Academia Integration',
    description: 'Aligned with BCA, MCA, and VTU/Autonomous engineering curricula to ensure 100% academic project compliance.',
    badge: 'University Aligned',
    icon: '🎓'
  },
  {
    title: 'Startup India Registered',
    subtitle: 'National Innovation Ecosystem',
    description: 'Empowered under the Government of India Startup India initiative, promoting technological innovation, software research, and engineering skill development.',
    badge: 'National Initiative',
    icon: '🇮🇳'
  },
  {
    title: 'IEEE Project Standards',
    subtitle: 'University Academic Compliance',
    description: 'Academic projects adhere to IEEE standard architecture models, SRS documentation, and rigorous software development lifecycle practices.',
    badge: 'IEEE Standard',
    icon: '📜'
  }
];
