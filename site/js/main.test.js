// Contract under test (docs/design/specs/customer-contact-site.md):
//   main.js  exports validate(fields, taal = 'nl'), buildMailto(fields, taal = 'nl'), init(doc, { navigate, clipboard })
//   i18n.js  exports EN, TITELS and TEKSTEN
//   fields = { rol, onderwerp, gebouw, naam, bedrijf, email, telefoon, bericht }
//     rol: 'eigenaar' | 'beheerder' | 'vve' | 'bewoner' | ''      onderwerp: 'partner' | 'storing' | 'vraag' | ''
//     gebouw: 'kantoor' | 'appartement' | 'businesscenter' | 'anders' | ''
// Hidden elements (field errors, #bewoner-melding, #storing-melding, #formulier-bevestiging) use the `hidden` attribute.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EN, TEKSTEN, TITELS } from './i18n.js';
import { buildMailto, init, validate } from './main.js';

const INDEX_HTML = resolve(process.cwd(), 'site/index.html');
const MAIN_JS = resolve(process.cwd(), 'site/js/main.js');
const I18N_JS = resolve(process.cwd(), 'site/js/i18n.js');
const PAGE_URL = 'https://newconet.test/';
const STORAGE_KEY = 'newconet-taal';
const PHONE = '+31 (0)6 21 10 55 02';
const TEL = 'tel:+31621105502';
const MAIL = 'mailto:info@newconet.nl';

// Each row: key, the element selector the spec names, whether the value lives in aria-label
// (data-i18n-aria) or innerHTML (data-i18n), the Dutch HTML and the English value.
// Generated from the copy tables in docs/design/specs/customer-contact-site.md.
const COPY = [
  ["skip","a.skip-link",false,"Direct naar de inhoud","Skip to content"],
  ["logoLabel","a",true,"NewCONet, naar het begin van de pagina","NewCONet, back to the top of the page"],
  ["navLabel","nav",true,"Hoofdmenu","Main menu"],
  ["navDiensten","a",false,"Diensten","Services"],
  ["navVoorWie","a",false,"Voor wie","Who we serve"],
  ["navWerkwijze","a",false,"Werkwijze","How we work"],
  ["navOverOns","a",false,"Over ons","About us"],
  ["navVragen","a",false,"Vragen","FAQ"],
  ["headerStoring","a.btn",false,"Storing?","Outage?"],
  ["headerCta","a.btn",false,"Neem contact op","Contact us"],
  ["heroEyebrow","p.hero-eyebrow",false,"Voor eigenaren, beheerders en VvE’s","For owners, property managers and owners’ associations"],
  ["heroTitel","h1",false,"Internet voor het hele gebouw.<br> Geregeld door één partner.","Internet for the whole building.<br> Arranged by one partner."],
  ["heroSub","p.hero-sub",false,"NewCONet levert internet en wifi in multi-tenant kantoorgebouwen en complete appartementencomplexen. Voor eigenaren, beheerders en VvE’s zijn wij een vaste partner: wij voorzien uw huurders of bewoners van internet, verzorgen de wifi in de algemene delen en zorgen voor het internet van de gebouwgebonden systemen.","NewCONet provides internet and wifi in multi-tenant office buildings and complete apartment complexes. For owners, property managers and owners’ associations, we are a dedicated partner: we provide your tenants or residents with internet, take care of the wifi in the common areas and look after the internet for the building systems."],
  ["heroCta1","a.btn",false,"Plan een kennismaking","Book an introductory call"],
  ["heroCta2","a.btn",false,"Bekijk onze diensten","View our services"],
  ["heroNoot","p.hero-noot",false,"Is NewCONet al actief in uw gebouw en is het gebouw ontsloten? Dan is een nieuwe huurder meestal <strong>binnen twee weken</strong> online.","If NewCONet is already active in your building and the building is connected to the outside network, a new tenant is usually online <strong>within two weeks</strong>."],
  ["heroVisualTitel","title",false,"Doorsnede van een kantoorgebouw en een appartementencomplex, met de internetverbinding van de straat naar elke verdieping, naar de gebouwsystemen en naar de wifi in de algemene delen","Cross-section of an office building and an apartment complex, showing the internet connection from the street to every floor, to the building systems and to the wifi in the common areas"],
  ["legenda1","li",false,"De verbinding van buiten naar het gebouw","The connection from outside into the building"],
  ["legenda2","li",false,"Een eigen aansluiting voor elke huurder","A dedicated connection for every tenant"],
  ["legenda3","li",false,"Internet voor de gebouwgebonden systemen","Internet for the building’s own systems"],
  ["legenda4","li",false,"Wifi in de algemene delen","Wifi in the common areas"],
  ["routesTitel","h2",false,"Wat wilt u doen?","What would you like to do?"],
  ["routesIntro","p.section-intro",false,"Wij werken voor eigenaren, beheerders en VvE’s van gebouwen, niet voor particulieren. Kies wat bij u past.","We work for owners, property managers and owners’ associations, not for private individuals. Choose what suits you."],
  ["routeKantoorTitel","h3",false,"Multi-tenant kantoorgebouw","Multi-tenant office building"],
  ["routeKantoorTekst","p",false,"U bent eigenaar of beheerder van een kantoorgebouw met meerdere huurders. Wij voorzien elke huurder van een eigen internetaansluiting en zorgen voor het internet van de gebouwgebonden systemen.","You own or manage an office building with multiple tenants. We provide every tenant with their own internet connection and take care of the internet for the building systems."],
  ["routeKantoorKnop","a.btn",false,"Plan een kennismaking","Book an introductory call"],
  ["routeAppTitel","h3",false,"Compleet appartementencomplex","Complete apartment complex"],
  ["routeAppTekst","p",false,"U bent eigenaar of beheerder van een appartementencomplex, of u zit in het bestuur van de VvE. Wij voorzien alle woningen in het complex van een internetaansluiting en zorgen voor het internet van de systemen van het complex.","You own or manage an apartment complex, or you sit on the board of its owners’ association (VvE). We provide every home in the complex with an internet connection and take care of the internet for the complex’s own systems."],
  ["routeAppKnop","a.btn",false,"Plan een kennismaking","Book an introductory call"],
  ["route3Titel","h3",false,"Klant met een storing of vraag","Customer with an outage or question"],
  ["route3Tekst","p",false,"Bent u klant van NewCONet? Bel ons op werkdagen tussen 08:30 en 17:30. Heeft u een SLA met ons afgesloten? Dan geldt wat daarin staat.","If you are a NewCONet customer, call us on working days between 08:30 and 17:30. If you have an SLA with us, its terms apply."],
  ["belKnop","a.btn",false,"Bel +31 (0)6 21 10 55 02","Call +31 (0)6 21 10 55 02"],
  ["route3Extra","p.route-extra",false,"Of mail naar <a href=\"mailto:info@newconet.nl\">info@newconet.nl</a>","Or email <a href=\"mailto:info@newconet.nl\">info@newconet.nl</a>"],
  ["route3Bewoner","p.route-extra",false,"Woont u in een appartementencomplex? Neem dan contact op met de eigenaar, de beheerder of de VvE van uw complex.","If you live in an apartment complex, please contact the owner, manager or owners’ association of your complex."],
  ["dienstenTitel","h2",false,"Onze diensten","Our services"],
  ["dienstenIntro","p.section-intro",false,"Internet, wifi en ondersteuning voor gebouwen met meerdere gebruikers, van de aansluiting tot het onderhoud.","Internet, wifi and support for buildings with multiple occupants, from connection to maintenance."],
  ["badgeSpecialisme","p.badge",false,"Ons specialisme","Our speciality"],
  ["dienst1Titel","h3",false,"Internet voor multi-tenant kantoorgebouwen","Internet for multi-tenant office buildings"],
  ["dienst1Tekst","p",false,"Elke huurder krijgt een eigen internetaansluiting. U als eigenaar of beheerder heeft één aanspreekpunt voor het hele gebouw.","Every tenant gets their own internet connection. As the owner or manager, you have one point of contact for the whole building."],
  ["dienst1Link","a.dienst-link",false,"Offerte aanvragen<span class=\"visually-hidden\"> voor internet in een multi-tenant kantoorgebouw</span>","Request a quote<span class=\"visually-hidden\"> for internet in a multi-tenant office building</span>"],
  ["dienst2Titel","h3",false,"Internet voor complete appartementencomplexen","Internet for complete apartment complexes"],
  ["dienst2Tekst","p",false,"Alle woningen in het complex krijgen een internetaansluiting. De afspraken maken wij met de eigenaar, de beheerder of de VvE.","Every home in the complex gets an internet connection. We make the arrangements with the owner, the manager or the owners’ association."],
  ["dienst2Link","a.dienst-link",false,"Offerte aanvragen<span class=\"visually-hidden\"> voor internet in een compleet appartementencomplex</span>","Request a quote<span class=\"visually-hidden\"> for internet in a complete apartment complex</span>"],
  ["dienstWifiTitel","h3",false,"Wifi in de algemene delen","Wifi in the common areas"],
  ["dienstWifiTekst","p",false,"Wifi in de algemene delen van het gebouw, zoals de entree, de lobby en ontmoetingsruimtes. Voor huurders, bewoners en bezoekers.","Wifi in the common areas of the building, such as the entrance, the lobby and meeting spaces. For tenants, residents and visitors."],
  ["dienstWifiLink","a.dienst-link",false,"Offerte aanvragen<span class=\"visually-hidden\"> voor wifi in de algemene delen</span>","Request a quote<span class=\"visually-hidden\"> for wifi in the common areas</span>"],
  ["dienstMaatwerkTitel","h3",false,"Hoogwaardige wifi op maat","High-end custom wifi"],
  ["dienstMaatwerkTekst","p",false,"Wifi-oplossingen op maat voor omgevingen met hoge eisen, zoals businesscenters. Wij stemmen de oplossing af op het gebouw en de gebruikers.","Custom wifi solutions for demanding environments, such as business centres. We tailor the solution to the building and its users."],
  ["dienstMaatwerkLink","a.dienst-link",false,"Plan een kennismaking<span class=\"visually-hidden\"> over wifi op maat</span>","Book an introductory call<span class=\"visually-hidden\"> about custom wifi</span>"],
  ["dienst3Titel","h3",false,"Internet voor gebouwgebonden systemen","Internet for building systems"],
  ["dienst3Tekst","p",false,"Internet voor de systemen van het gebouw zelf, zoals toegangscontrole, liften, klimaatinstallaties en camera’s. Zo ondersteunen wij eigenaren, beheerders en VvE’s.","Internet for the building’s own systems, such as access control, lifts, climate control and cameras. This is how we support owners, managers and owners’ associations."],
  ["dienst3Link","a.dienst-link",false,"Offerte aanvragen<span class=\"visually-hidden\"> voor internet voor gebouwgebonden systemen</span>","Request a quote<span class=\"visually-hidden\"> for internet for building systems</span>"],
  ["dienst4Titel","h3",false,"Partner voor eigenaren, beheerders en VvE’s","Partner for owners, managers and owners’ associations"],
  ["dienst4Tekst","p",false,"Wij voorzien uw huurders of bewoners van internetaansluitingen en -diensten. Zo biedt u goed internet als onderdeel van uw gebouw, zonder dat u het zelf hoeft te regelen.","We provide your tenants or residents with internet connections and services. That way, you offer good internet as part of your building without having to arrange it yourself."],
  ["dienst4Link","a.dienst-link",false,"Plan een kennismaking<span class=\"visually-hidden\"> over een partnerschap</span>","Book an introductory call<span class=\"visually-hidden\"> about a partnership</span>"],
  ["dienst5Titel","h3",false,"Ondersteuning en onderhoud","Support and maintenance"],
  ["dienst5Tekst","p",false,"Wij blijven u ondersteunen, doen het onderhoud en denken mee met wat u nodig heeft. Wij zijn bereikbaar op werkdagen. Een ruimere SLA is mogelijk op aanvraag.","We keep supporting you, carry out the maintenance and work with you on what you need. We are available on working days. A more extensive SLA is available on request."],
  ["dienst5Link","a.dienst-link",false,"Vraag naar een SLA<span class=\"visually-hidden\"> op maat</span>","Ask about an SLA<span class=\"visually-hidden\"> tailored to you</span>"],
  ["dienst6Titel","h3",false,"Nieuwe huurders snel online","New tenants online quickly"],
  ["dienst6Tekst","p",false,"Is NewCONet al actief in uw gebouw en is het gebouw ontsloten? Dan is een nieuwe huurder meestal binnen twee weken online.","If NewCONet is already active in your building and the building is connected to the outside network, a new tenant is usually online within two weeks."],
  ["dienst6Link","a.dienst-link",false,"Neem contact op<span class=\"visually-hidden\"> over nieuwe huurders</span>","Get in touch<span class=\"visually-hidden\"> about new tenants</span>"],
  ["voorWieTitel","h2",false,"Voor wie wij werken","Who we serve"],
  ["voorWieIntro","p.section-intro",false,"Wij werken voor de partijen die over het internet in een gebouw beslissen: eigenaren, beheerders en VvE’s. Wij werken niet voor particulieren.","We work for the parties who decide on the internet in a building: owners, property managers and owners’ associations. We do not work for private individuals."],
  ["persona1Titel","h3",false,"Eigenaren","Owners"],
  ["persona1Tekst","p",false,"U wilt dat uw huurders of bewoners goed internet hebben, zonder dat u het zelf hoeft te regelen. Wij voorzien hen van internet en zorgen voor het internet van de gebouwgebonden systemen.","You want your tenants or residents to have good internet without having to arrange it yourself. We provide them with internet and take care of the internet for the building systems."],
  ["persona2Titel","h3",false,"Beheerders","Property managers"],
  ["persona2Tekst","p",false,"U wilt het internet in het gebouw onderbrengen bij een vaste partner. Wij verzorgen de aansluitingen en het onderhoud, en denken mee als het gebouw verandert.","You want to place the internet in the building with a dedicated partner. We handle the connections and the maintenance, and help you plan as the building changes."],
  ["persona3Titel","h3",false,"VvE’s","Owners’ associations (VvE)"],
  ["persona3Tekst","p",false,"U wilt als bestuur goed internet voor alle woningen in het complex. Wij voorzien elke woning van een internetaansluiting en maken de afspraken met het bestuur.","As a board, you want good internet for every home in the complex. We provide every home with an internet connection and make the arrangements with the board."],
  ["huurderA","text",false,"Huurder A","Tenant A"],
  ["huurderB","text",false,"Huurder B","Tenant B"],
  ["huurderC","text",false,"Huurder C","Tenant C"],
  ["huurderD","text",false,"Huurder D","Tenant D"],
  ["badgeSpecialisme2","p.badge",false,"Ons specialisme","Our speciality"],
  ["voorWie1Titel","h3",false,"Multi-tenant kantoorgebouwen","Multi-tenant office buildings"],
  ["voorWie1Tekst","p",false,"In een kantoorgebouw met meerdere huurders wil elk bedrijf zonder gedoe aan de slag. Wij zorgen ervoor dat elke huurder een eigen aansluiting heeft. Is het gebouw ontsloten en zijn wij er al actief? Dan is een nieuwe huurder meestal binnen twee weken online.","In an office building with multiple tenants, every business wants to get started without any hassle. We make sure every tenant has their own connection. If the building is connected and we are already active there, a new tenant is usually online within two weeks."],
  ["voorWie1Punt1","li",false,"Eén aanspreekpunt voor de eigenaar of beheerder","One point of contact for the owner or manager"],
  ["voorWie1Punt2","li",false,"Een eigen internetaansluiting per huurder","A dedicated internet connection for each tenant"],
  ["voorWie1Punt3","li",false,"Internet voor de gebouwgebonden systemen","Internet for the building systems"],
  ["voorWie1Punt4","li",false,"Wifi in de algemene delen, of hoogwaardige wifi op maat","Wifi in the common areas, or high-end custom wifi"],
  ["voorWie1Knop","a.btn",false,"Plan een kennismaking","Book an introductory call"],
  ["voorWie2Titel","h3",false,"Complete appartementencomplexen","Complete apartment complexes"],
  ["voorWie2Tekst","p",false,"Voor een appartementencomplex werken wij voor de eigenaar, de beheerder of de VvE. Wij voorzien alle woningen van een internetaansluiting en zorgen voor het internet van de systemen van het complex.","For an apartment complex, we work for the owner, the manager or the owners’ association. We provide every home with an internet connection and take care of the internet for the complex’s own systems."],
  ["voorWie2Punt1","li",false,"Een internetaansluiting voor alle woningen","An internet connection for every home"],
  ["voorWie2Punt4","li",false,"Wifi in de algemene delen van het complex","Wifi in the common areas of the complex"],
  ["voorWie2Punt2","li",false,"Afspraken met de eigenaar, de beheerder of de VvE","Arrangements with the owner, the manager or the owners’ association"],
  ["voorWie2Punt3","li",false,"Ondersteuning op werkdagen, ruimere SLA op aanvraag","Support on working days, a more extensive SLA on request"],
  ["voorWie2Knop","a.btn",false,"Neem contact op","Get in touch"],
  ["werkwijzeTitel","h2",false,"Zo werken wij","How we work"],
  ["werkwijzeIntro","p.section-intro",false,"Van de eerste kennismaking tot de dagelijkse ondersteuning: zo verloopt een samenwerking met NewCONet.","From the first introduction to day-to-day support: this is what working with NewCONet looks like."],
  ["stap1Titel","h3",false,"Kennismaking","Introduction"],
  ["stap1Tekst","p",false,"U neemt contact met ons op als eigenaar, beheerder of VvE. U heeft persoonlijk contact met ons.","You contact us as an owner, property manager or owners’ association. You deal with us personally."],
  ["stap2Titel","h3",false,"Het gebouw in kaart brengen","Mapping the building"],
  ["stap2Tekst","p",false,"Samen met u bekijken wij het gebouw, de huurders of bewoners en de systemen die internet nodig hebben.","Together with you, we look at the building, the tenants or residents and the systems that need internet."],
  ["stap3Titel","h3",false,"Voorstel op maat","A tailored proposal"],
  ["stap3Tekst","p",false,"U ontvangt een voorstel en een vrijblijvende offerte die passen bij uw gebouw.","You receive a proposal and a no-obligation quote that fit your building."],
  ["stap4Titel","h3",false,"Aansluiten","Connecting"],
  ["stap4Tekst","p",false,"Wij sluiten de huurders of woningen en de gebouwgebonden systemen aan. Is het gebouw ontsloten en zijn wij er al actief? Dan leveren wij een internetdienst meestal binnen twee weken.","We connect the tenants or homes and the building systems. If the building is connected and we are already active there, we usually deliver an internet service within two weeks."],
  ["stap5Titel","h3",false,"Ondersteuning en onderhoud","Support and maintenance"],
  ["stap5Tekst","p",false,"Wij blijven u ondersteunen, doen het onderhoud en denken mee als uw behoefte verandert.","We keep supporting you, carry out the maintenance and help you plan as your needs change."],
  ["werkwijzeKnop","a.btn",false,"Plan een kennismaking","Book an introductory call"],
  ["overOnsTitel","h2",false,"Over NewCONet","About NewCONet"],
  ["overOns1","p",false,"NewCONet levert internet en wifi in gebouwen met meerdere gebruikers. Wij zijn gespecialiseerd in multi-tenant kantoorgebouwen en voorzien daarnaast complete appartementencomplexen van internet.","NewCONet provides internet and wifi in buildings with multiple occupants. We specialise in multi-tenant office buildings and also provide internet for complete apartment complexes."],
  ["overOns2","p",false,"Voor eigenaren, beheerders en VvE’s zijn wij een vaste partner. Wij zorgen voor de internetaansluitingen van hun huurders en bewoners en voor het internet van de gebouwgebonden systemen. Wij werken niet voor particulieren.","For owners, property managers and owners’ associations, we are a dedicated partner. We take care of their tenants’ and residents’ internet connections and of the internet for the building systems. We do not work for private individuals."],
  ["overOnsPunt1","li",false,"Persoonlijk contact","Personal contact"],
  ["overOnsPunt2","li",false,"Gespecialiseerd in multi-tenant kantoorgebouwen","Specialised in multi-tenant office buildings"],
  ["overOnsPunt3","li",false,"Onderhoud en meedenken, ook na de oplevering","Maintenance and joint planning, continuing after handover"],
  ["stat1Num","span.stat-num",false,"Binnen 2 weken","Within 2 weeks"],
  ["stat1Label","span.stat-label",false,"meestal, in een ontsloten gebouw waar wij al actief zijn","usually, in a connected building where we are already active"],
  ["stat2Num","span.stat-num",false,"Ma–vr","Mon–Fri"],
  ["stat2Label","span.stat-label",false,"ondersteuning van 08:30 tot 17:30","support from 08:30 to 17:30"],
  ["stat3Num","span.stat-num",false,"SLA op maat","Tailored SLA"],
  ["stat3Label","span.stat-label",false,"ruimere afspraken op aanvraag","more extensive agreements on request"],
  ["faqTitel","h2",false,"Veelgestelde vragen","Frequently asked questions"],
  ["faqIntro","p.section-intro",false,"Staat uw vraag er niet bij? <a href=\"#contactformulier\" data-onderwerp=\"vraag\">Stuur ons een bericht</a>.","Can’t find your question? <a href=\"#contactformulier\" data-onderwerp=\"vraag\">Send us a message</a>."],
  ["faq1V","summary",false,"Welke internetdiensten levert NewCONet?","Which internet services does NewCONet provide?"],
  ["faq1A","p",false,"NewCONet levert internetdiensten in multi-tenant kantoorgebouwen en complete appartementencomplexen, voor eigenaren, beheerders en VvE’s. Wij zorgen voor de internetaansluitingen van huurders en bewoners, voor wifi in de algemene delen en hoogwaardige wifi op maat, voor het internet van gebouwgebonden systemen, en voor de ondersteuning en het onderhoud daarvan.","NewCONet provides internet services in multi-tenant office buildings and complete apartment complexes, for owners, property managers and owners’ associations. We take care of the internet connections for tenants and residents, wifi in the common areas and high-end custom wifi, internet for building systems, and the support and maintenance that go with them."],
  ["faq2V","summary",false,"Voor welke gebouwen werkt NewCONet?","Which buildings does NewCONet work for?"],
  ["faq2A","p",false,"NewCONet is gespecialiseerd in multi-tenant kantoorgebouwen: kantoorgebouwen met meerdere huurders. Daarnaast voorziet NewCONet complete appartementencomplexen van internet.","NewCONet specialises in multi-tenant office buildings: office buildings with several tenants. NewCONet also provides internet for complete apartment complexes."],
  ["faq11V","summary",false,"Levert NewCONet ook aan particulieren?","Does NewCONet supply private individuals?"],
  ["faq11A","p",false,"Nee. NewCONet werkt alleen voor eigenaren, beheerders en VvE’s van gebouwen, niet voor particulieren. Woont u in een appartementencomplex en heeft u een vraag over uw internet? Neem dan contact op met de eigenaar, de beheerder of de VvE van uw complex.","No. NewCONet works only for owners, property managers and owners’ associations, not for private individuals. If you live in an apartment complex and have a question about your internet, please contact the owner, manager or owners’ association of your complex."],
  ["faq12V","summary",false,"Wat is internet voor een compleet appartementencomplex?","What is internet for a complete apartment complex?"],
  ["faq12A","p",false,"NewCONet voorziet alle woningen in een appartementencomplex van een internetaansluiting. De afspraken daarover maakt NewCONet met de eigenaar, de beheerder of de VvE van het complex, niet met individuele bewoners.","NewCONet provides every home in an apartment complex with an internet connection. NewCONet makes the arrangements with the owner, the manager or the owners’ association of the complex, not with individual residents."],
  ["faq13V","summary",false,"Kan een VvE met NewCONet samenwerken?","Can an owners’ association (VvE) work with NewCONet?"],
  ["faq13A","p",false,"Ja. Bij een appartementencomplex kan de VvE onze opdrachtgever zijn, net als de eigenaar of de beheerder. NewCONet voorziet dan alle woningen in het complex van een internetaansluiting.","Yes. For an apartment complex, the owners’ association can be our client, just like the owner or the manager. NewCONet then provides every home in the complex with an internet connection."],
  ["faq14V","summary",false,"Levert NewCONet ook wifi?","Does NewCONet also provide wifi?"],
  ["faq14A","p",false,"Ja. NewCONet verzorgt wifi in de algemene delen van gebouwen, zoals de entree, de lobby en ontmoetingsruimtes. Daarnaast levert NewCONet hoogwaardige wifi-oplossingen op maat voor omgevingen met hoge eisen, zoals businesscenters.","Yes. NewCONet takes care of wifi in the common areas of buildings, such as the entrance, the lobby and meeting spaces. NewCONet also provides high-end custom wifi solutions for demanding environments, such as business centres."],
  ["faq3V","summary",false,"Wat is een multi-tenant kantoorgebouw?","What is a multi-tenant office building?"],
  ["faq3A","p",false,"Een multi-tenant kantoorgebouw is een kantoorgebouw waarin meerdere bedrijven ruimte huren. In zo’n gebouw krijgt elke huurder van NewCONet een eigen internetaansluiting. De eigenaar of beheerder heeft één aanspreekpunt voor het internet in het hele gebouw.","A multi-tenant office building is an office building in which several businesses rent space. In such a building, every tenant gets their own internet connection from NewCONet. The owner or manager has one point of contact for the internet in the whole building."],
  ["faq4V","summary",false,"Hoe snel is een nieuwe huurder online?","How quickly is a new tenant online?"],
  ["faq4A","p",false,"Is NewCONet al actief in het gebouw en is het gebouw ontsloten? Dan is een nieuwe huurder meestal binnen twee weken online. In andere gevallen hangt de levertijd af van het gebouw. Die bespreken wij vooraf met u.","If NewCONet is already active in the building and the building is connected to the outside network, a new tenant is usually online within two weeks. In other cases, the delivery time depends on the building, and we discuss it with you in advance."],
  ["faq5V","summary",false,"Wat betekent ‘ontsloten’?","What does ‘connected building’ mean?"],
  ["faq5A","p",false,"Een gebouw is ontsloten als het een verbinding heeft met het netwerk buiten het gebouw. Via die verbinding levert NewCONet internet aan de huurders en aan de systemen in het gebouw.","A building is connected when it has a link to the network outside the building. Through that link, NewCONet delivers internet to the tenants and to the systems in the building."],
  ["faq6V","summary",false,"Wat zijn gebouwgebonden systemen?","What are building systems?"],
  ["faq6A","p",false,"Gebouwgebonden systemen zijn systemen die bij het gebouw horen, zoals toegangscontrole, liften, klimaatinstallaties en camera’s. NewCONet levert het internet dat deze systemen nodig hebben en ondersteunt daarmee eigenaren, beheerders en VvE’s.","Building systems are systems that belong to the building, such as access control, lifts, climate control and cameras. NewCONet provides the internet these systems need, and in doing so supports owners, property managers and owners’ associations."],
  ["faq7V","summary",false,"Ik ben eigenaar, beheerder of VvE-bestuurder. Wat regelt NewCONet voor mijn gebouw?","I am an owner, property manager or VvE board member. What does NewCONet arrange for my building?"],
  ["faq7A","p",false,"NewCONet voorziet uw huurders of bewoners van internetaansluitingen en -diensten, zorgt voor het internet van de gebouwgebonden systemen en denkt met u mee over wat uw gebouw nodig heeft. Voor het internet in het hele gebouw heeft u één aanspreekpunt.","NewCONet provides your tenants or residents with internet connections and services, takes care of the internet for the building systems and works with you on what your building needs. You have one point of contact for the internet in the whole building."],
  ["faq8V","summary",false,"Wanneer is NewCONet bereikbaar?","When can I reach NewCONet?"],
  ["faq8A","p",false,"NewCONet is voor klanten bereikbaar op werkdagen, van maandag tot en met vrijdag, van 08:30 tot 17:30. U belt ons op +31 (0)6 21 10 55 02 of mailt naar info@newconet.nl. Buiten kantoortijden biedt NewCONet standaard geen ondersteuning.","NewCONet is available to customers on working days, Monday to Friday, from 08:30 to 17:30. You can call us on +31 (0)6 21 10 55 02 or email info@newconet.nl. As standard, NewCONet does not provide support outside office hours."],
  ["faq9V","summary",false,"Biedt NewCONet een SLA aan?","Does NewCONet offer an SLA?"],
  ["faq9A","p",false,"Ja, op aanvraag. Heeft u meer nodig dan ondersteuning op werkdagen van 08:30 tot 17:30? Dan maakt NewCONet een SLA op maat.","Yes, on request. If you need more than support on working days from 08:30 to 17:30, NewCONet can draw up a tailored SLA."],
  ["faq10V","summary",false,"Is een offerte van NewCONet vrijblijvend?","Is a quote from NewCONet free of obligation?"],
  ["faq10A","p",false,"Ja. U vraagt een offerte aan via het formulier onderaan deze pagina, per e-mail of telefonisch.","Yes. You can request a quote using the form at the bottom of this page, by email or by phone."],
  ["storingTitel","h2",false,"Storing? Bel ons op werkdagen","Outage? Call us on working days"],
  ["storingTekst","p",false,"Voor klanten zijn wij bereikbaar van maandag tot en met vrijdag, van 08:30 tot 17:30. Heeft u een SLA met ons afgesloten? Dan geldt wat daarin staat.","For customers, we are available Monday to Friday, from 08:30 to 17:30. If you have an SLA with us, its terms apply."],
  ["storingKern","p.storing-kern",false,"Wilt u ruimere afspraken over ondersteuning? Vraag naar een SLA op maat.","Need more extensive support agreements? Ask about a tailored SLA."],
  ["storingBewoner","p",false,"Woont u in een appartementencomplex? Meld een storing dan bij de eigenaar, de beheerder of de VvE van uw complex.","If you live in an apartment complex, please report an outage to the owner, manager or owners’ association of your complex."],
  ["belKnop2","a.btn",false,"Bel +31 (0)6 21 10 55 02","Call +31 (0)6 21 10 55 02"],
  ["contactTitel","h2",false,"Neem contact op","Get in touch"],
  ["contactIntro","p",false,"Bent u eigenaar, beheerder of VvE-bestuurder en wilt u internet voor uw gebouw? Of heeft u een vraag? Neem gerust contact op.","Are you an owner, property manager or VvE board member and would you like internet for your building? Or do you have a question? Feel free to get in touch."],
  ["contactBewoner","p.contact-bewoner",false,"Bent u bewoner of huurder? Neem dan contact op met de eigenaar, de beheerder of de VvE van uw gebouw.","If you are a resident or tenant, please contact the owner, manager or owners’ association of your building."],
  ["lblTelefoon","strong",false,"Telefoon","Phone"],
  ["telefoonHint","span.detail-hint",false,"Op werkdagen van 08:30 tot 17:30","On working days from 08:30 to 17:30"],
  ["lblEmail","strong",false,"E-mail","Email"],
  ["lblTijden","strong",false,"Bereikbaarheid","Office hours"],
  ["tijden","span",false,"Ma–vr: 08:30–17:30","Mon–Fri: 08:30–17:30"],
  ["footerTagline","p",false,"Internet en wifi voor multi-tenant kantoorgebouwen en complete appartementencomplexen. Voor eigenaren, beheerders en VvE’s, niet voor particulieren.","Internet and wifi for multi-tenant office buildings and complete apartment complexes. For owners, property managers and owners’ associations, not for private individuals."],
  ["footerContact","h2",false,"Contact","Contact"],
  ["footerTel","span",false,"Telefoon:","Phone:"],
  ["footerMail","span",false,"E-mail:","Email:"],
  ["footerTijden","li",false,"Ma–vr: 08:30–17:30","Mon–Fri: 08:30–17:30"],
  ["footerSla","li",false,"Ruimere SLA op aanvraag","More extensive SLA on request"],
  ["footerNavLabel","nav",true,"Voettekst","Footer"],
  ["footerSnel","h2",false,"Snel naar","Quick links"],
  ["navDiensten2","a",false,"Diensten","Services"],
  ["navVoorWie2","a",false,"Voor wie","Who we serve"],
  ["navWerkwijze2","a",false,"Werkwijze","How we work"],
  ["navOverOns2","a",false,"Over ons","About us"],
  ["navVragen2","a",false,"Vragen","FAQ"],
  ["navContact2","a",false,"Contact","Contact"],
  ["rechten","span",false,"NewCONet. Alle rechten voorbehouden.","NewCONet. All rights reserved."],
  ["barLabel","nav",true,"Snel contact","Quick contact"],
  ["barBellen","a",false,"Bellen","Call"],
  ["barMailen","a",false,"Mailen","Email"],
  ["barContact","a.contact-bar-offerte",false,"Contact","Contact"],
  ["formTitel","h3",false,"Stuur ons een bericht","Send us a message"],
  ["formIntro","p.form-intro",false,"Vul het formulier in. Daarna opent uw e-mailprogramma een e-mail aan info@newconet.nl met uw bericht. Die e-mail verstuurt u zelf.","Fill in the form. Your email app then opens an email to info@newconet.nl with your message. You send that email yourself."],
  ["lblRol","label",false,"Wie bent u?","Who are you?"],
  ["rolKies","option",false,"Kies uw rol","Choose your role"],
  ["rolEigenaar","option",false,"Eigenaar van het gebouw","Owner of the building"],
  ["rolBeheerder","option",false,"Beheerder van het gebouw","Manager of the building"],
  ["rolVve","option",false,"Bestuur van een VvE","Board of an owners’ association (VvE)"],
  ["rolBewoner","option",false,"Bewoner of huurder","Resident or tenant"],
  ["bewonerKop","p.storing-melding-kop",false,"Neem contact op met uw eigenaar, beheerder of VvE","Please contact your owner, manager or owners’ association"],
  ["bewonerTekst","p",false,"NewCONet maakt de afspraken over internet met de eigenaar, de beheerder of de VvE van een gebouw, niet met individuele bewoners of huurders. Zij kunnen contact met ons opnemen.","NewCONet makes its internet arrangements with the owner, manager or owners’ association of a building, not with individual residents or tenants. They can get in touch with us."],
  ["formLegend","legend",false,"Waarmee kunnen wij u helpen?","How can we help you?"],
  ["optPartner","span",false,"Kennismaking of offerte voor mijn gebouw","Introduction or quote for my building"],
  ["optStoring","span",false,"Storing of ondersteuning","Outage or support"],
  ["optVraag","span",false,"Algemene vraag","General question"],
  ["lblGebouw","span",false,"Om welk type gebouw gaat het?","What type of building is it?"],
  ["optioneel","span.field-optional",false,"(optioneel)","(optional)"],
  ["gebouwOnbekend","option",false,"Nog niet bekend","Not known yet"],
  ["gebouwKantoor","option",false,"Multi-tenant kantoorgebouw","Multi-tenant office building"],
  ["gebouwAppartement","option",false,"Appartementencomplex","Apartment complex"],
  ["gebouwBusinesscenter","option",false,"Businesscenter","Business centre"],
  ["gebouwAnders","option",false,"Anders","Other"],
  ["lblNaam","label",false,"Naam","Name"],
  ["lblOrganisatie","label",false,"Naam van uw organisatie of VvE","Name of your organisation or owners’ association"],
  ["lblEmailadres","label",false,"E-mailadres","Email address"],
  ["lblTelefoonnummer","span",false,"Telefoonnummer","Phone number"],
  ["optioneel3","span.field-optional",false,"(optioneel)","(optional)"],
  ["telefoonveldHint","p.field-hint",false,"Handig als wij u willen terugbellen.","Useful if we need to call you back."],
  ["lblBericht","label",false,"Bericht","Message"],
  ["berichtHint","p.field-hint",false,"Maximaal 1500 tekens.","Up to 1,500 characters."],
  ["formKnop","button.btn",false,"Open dit bericht in uw e-mailprogramma","Open this message in your email app"],
  ["storingMeldingKop","p.storing-melding-kop",false,"Storing? Bel ons op werkdagen","Outage? Call us on working days"],
  ["storingMeldingTekst","p",false,"Voor klanten zijn wij bereikbaar van maandag tot en met vrijdag, van 08:30 tot 17:30. Heeft u een SLA met ons afgesloten? Dan geldt wat daarin staat.","For customers, we are available Monday to Friday, from 08:30 to 17:30. If you have an SLA with us, its terms apply."],
  ["belKnop3","a.btn.btn-alert",false,"Bel +31 (0)6 21 10 55 02","Call +31 (0)6 21 10 55 02"],
  ["storingMeldingBewoner","p.storing-melding-rest",false,"Woont u in een appartementencomplex? Meld een storing dan bij de eigenaar, de beheerder of de VvE van uw complex.","If you live in an apartment complex, please report an outage to the owner, manager or owners’ association of your complex."],
  ["bevestigingTitel","h4#bevestiging-titel",false,"Nog één stap: verstuur de e-mail","One more step: send the email"],
  ["bevestigingTekst","p",false,"Uw e-mailprogramma opent een nieuwe e-mail aan info@newconet.nl met uw bericht erin. Pas als u die e-mail verstuurt, ontvangen wij uw bericht.","Your email app opens a new email to info@newconet.nl with your message in it. We only receive your message once you send that email."],
  ["bevestigingFallback","p",false,"Is er geen e-mail geopend? Kopieer dan uw bericht en mail het naar <a href=\"mailto:info@newconet.nl\" aria-label=\"Mail naar info@newconet.nl\">info@newconet.nl</a>. U kunt ons op werkdagen ook bellen op <a href=\"tel:+31621105502\" aria-label=\"Bel +31 (0)6 21 10 55 02\">+31 (0)6 21 10 55 02</a>.","If no email opened, copy your message and email it to <a href=\"mailto:info@newconet.nl\" aria-label=\"Email info@newconet.nl\">info@newconet.nl</a>. You can also call us on <a href=\"tel:+31621105502\" aria-label=\"Call +31 (0)6 21 10 55 02\">+31 (0)6 21 10 55 02</a> on working days."],
  ["berichtKopieLabel","label.visually-hidden",false,"Uw bericht","Your message"],
  ["kopieerKnop","button#kopieer-bericht",false,"Kopieer bericht","Copy message"],
  ["mailtoOpnieuw","a#mailto-opnieuw",false,"Open de e-mail opnieuw","Open the email again"],
];

const TITLE_NL = 'NewCONet | Internet en wifi voor multi-tenant kantoorgebouwen en complete appartementencomplexen';
const TITLE_EN = 'NewCONet | Internet and wifi for multi-tenant office buildings and complete apartment complexes';
const META_DESCRIPTION =
  'NewCONet levert internet en wifi in multi-tenant kantoorgebouwen en complete appartementencomplexen, voor eigenaren, beheerders en VvE’s. Niet voor particulieren.';

const FULL = {
  rol: 'eigenaar',
  onderwerp: 'partner',
  gebouw: 'kantoor',
  naam: 'Jan de Vries',
  bedrijf: 'Voorbeeld Vastgoed BV',
  email: 'jan@voorbeeld.nl',
  telefoon: '06 12345678',
  bericht: 'Wij zoeken internet voor de huurders in ons kantoorgebouw.',
};
const FULL_BODY = {
  nl: [
    'Rol: Eigenaar van het gebouw',
    'Onderwerp: Kennismaking of offerte voor mijn gebouw',
    'Gebouw: Multi-tenant kantoorgebouw',
    'Naam: Jan de Vries',
    'Organisatie: Voorbeeld Vastgoed BV',
    'E-mailadres: jan@voorbeeld.nl',
    'Telefoon: 06 12345678',
    '',
    'Bericht:',
    FULL.bericht,
  ].join('\r\n'),
  en: [
    'Role: Owner of the building',
    'Topic: Introduction or quote for my building',
    'Building: Multi-tenant office building',
    'Name: Jan de Vries',
    'Organisation: Voorbeeld Vastgoed BV',
    'Email address: jan@voorbeeld.nl',
    'Phone: 06 12345678',
    '',
    'Message:',
    FULL.bericht,
  ].join('\r\n'),
};

const MSG = {
  nl: {
    rol: 'Kies uw rol.',
    rolBewoner: 'Neem contact op met de eigenaar, de beheerder of de VvE van uw gebouw.',
    onderwerp: 'Kies waarmee wij u kunnen helpen.',
    naam: 'Vul uw naam in.',
    bedrijf: 'Vul de naam van uw organisatie of VvE in.',
    emailLeeg: 'Vul uw e-mailadres in.',
    emailFout: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.',
    telefoon: 'Vul een geldig telefoonnummer in, of laat dit veld leeg.',
    bericht: 'Vul uw bericht in.',
  },
  en: {
    rol: 'Choose your role.',
    rolBewoner: 'Please contact the owner, manager or owners’ association of your building.',
    onderwerp: 'Choose how we can help you.',
    naam: 'Enter your name.',
    bedrijf: 'Enter the name of your organisation or owners’ association.',
    emailLeeg: 'Enter your email address.',
    emailFout: 'Enter a valid email address, for example name@company.com.',
    telefoon: 'Enter a valid phone number, or leave this field empty.',
    bericht: 'Enter your message.',
  },
};
const STATUS = {
  nl: {
    onvolledig: 'Het formulier is nog niet compleet. Controleer de gemarkeerde velden.',
    storing: 'Storing? Bel ons op werkdagen tussen 08:30 en 17:30 op +31 (0)6 21 10 55 02.',
    bewoner:
      'NewCONet maakt geen afspraken met individuele bewoners of huurders. Neem contact op met de eigenaar, de beheerder of de VvE van uw gebouw.',
    geopend: 'Uw e-mailprogramma wordt geopend. Verstuur de e-mail, dan ontvangen wij uw bericht.',
    gekopieerd: 'Bericht gekopieerd.',
    kopieerFout: 'Kopiëren is niet gelukt. Selecteer de tekst en kopieer hem zelf.',
  },
  en: {
    onvolledig: 'The form is not complete yet. Check the highlighted fields.',
    storing: 'Outage? Call us on +31 (0)6 21 10 55 02 on working days between 08:30 and 17:30.',
    bewoner:
      'NewCONet does not make arrangements with individual residents or tenants. Please contact the owner, manager or owners’ association of your building.',
    geopend: 'Your email app is opening. Send the email and we will receive your message.',
    gekopieerd: 'Message copied.',
    kopieerFout: 'Copying failed. Select the text and copy it yourself.',
  },
};

const ROLLEN = {
  nl: { eigenaar: 'Eigenaar van het gebouw', beheerder: 'Beheerder van het gebouw', vve: 'Bestuur van een VvE', bewoner: 'Bewoner of huurder' },
  en: {
    eigenaar: 'Owner of the building',
    beheerder: 'Manager of the building',
    vve: 'Board of an owners’ association (VvE)',
    bewoner: 'Resident or tenant',
  },
};
const ONDERWERPEN = {
  nl: {
    partner: { label: 'Kennismaking of offerte voor mijn gebouw', subject: 'Kennismaking of offerte via de website' },
    storing: { label: 'Storing of ondersteuning', subject: 'Storing of ondersteuning via de website' },
    vraag: { label: 'Algemene vraag', subject: 'Vraag via de website' },
  },
  en: {
    partner: { label: 'Introduction or quote for my building', subject: 'Introduction or quote via the website' },
    storing: { label: 'Outage or support', subject: 'Outage or support via the website' },
    vraag: { label: 'General question', subject: 'Question via the website' },
  },
};
const GEBOUWEN = {
  nl: { kantoor: 'Multi-tenant kantoorgebouw', appartement: 'Appartementencomplex', businesscenter: 'Businesscenter', anders: 'Anders' },
  en: { kantoor: 'Multi-tenant office building', appartement: 'Apartment complex', businesscenter: 'Business centre', anders: 'Other' },
};
const REGELS = {
  nl: { rol: 'Rol', onderwerp: 'Onderwerp', gebouw: 'Gebouw', naam: 'Naam', organisatie: 'Organisatie', email: 'E-mailadres', telefoon: 'Telefoon', bericht: 'Bericht' },
  en: { rol: 'Role', onderwerp: 'Topic', gebouw: 'Building', naam: 'Name', organisatie: 'Organisation', email: 'Email address', telefoon: 'Phone', bericht: 'Message' },
};
const TAAL_KNOP = {
  nl: { tekst: 'EN', lang: 'en', label: 'Switch to English (EN)' },
  en: { tekst: 'NL', lang: 'nl', label: 'Schakel naar Nederlands (NL)' },
};
const MENU_LABEL = {
  nl: { openen: 'Menu openen', sluiten: 'Menu sluiten' },
  en: { openen: 'Open menu', sluiten: 'Close menu' },
};

const decode = (href) => {
  const query = href.slice(href.indexOf('?') + 1);
  const parts = Object.fromEntries(query.split('&').map((p) => p.split('=')));
  return { subject: decodeURIComponent(parts.subject), body: decodeURIComponent(parts.body) };
};
const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

// ---------------------------------------------------------------- the i18n module

describe('the i18n module', () => {
  it('holds the two page titles the spec fixes', () => {
    expect(TITELS).toEqual({ nl: TITLE_NL, en: TITLE_EN });
  });

  it('gives both languages the same string keys', () => {
    expect(Object.keys(TEKSTEN).sort()).toEqual(['en', 'nl']);
    expect(flatten(TEKSTEN.en).sort()).toEqual(flatten(TEKSTEN.nl).sort());
  });

  it.each(['nl', 'en'])('holds the validation messages in %s', (taal) => {
    expect(TEKSTEN[taal].fouten).toMatchObject(MSG[taal]);
  });

  it.each(['nl', 'en'])('holds the status messages in %s', (taal) => {
    expect(TEKSTEN[taal].status).toMatchObject(STATUS[taal]);
  });

  it.each(['nl', 'en'])('holds the menu labels, language button strings and labels in %s', (taal) => {
    expect(TEKSTEN[taal].menu).toMatchObject(MENU_LABEL[taal]);
    expect(TEKSTEN[taal].taalKnop).toMatchObject(TAAL_KNOP[taal]);
    expect(TEKSTEN[taal].rollen).toMatchObject(ROLLEN[taal]);
    expect(TEKSTEN[taal].gebouwen).toMatchObject(GEBOUWEN[taal]);
    expect(TEKSTEN[taal].regels).toMatchObject(REGELS[taal]);
    expect(TEKSTEN[taal].onderwerpen).toMatchObject(ONDERWERPEN[taal]);
  });

  it.each(COPY)('holds the English value of %s', (key, _selector, _aria, _nl, en) => {
    expect(EN[key]).toBe(en);
  });

  it('holds no English entry that the copy tables do not list', () => {
    expect(Object.keys(EN).length).toBe(COPY.length);
    expect(Object.keys(EN).filter((key) => !COPY.some((row) => row[0] === key))).toEqual([]);
  });

  it.each(['mock', 'adresTodo', 'adresTodo2', 'lblAdres', 'kvk', 'btw', 'formPrivacy', 'privacyLink', 'lblBedrijf', 'optioneel2'])(
    'holds no English entry for the mock-only key %s',
    (key) => {
      expect(Object.keys(EN).length).toBeGreaterThan(0);
      expect(EN).not.toHaveProperty(key);
    },
  );
});

// ---------------------------------------------------------------- pure functions

describe('validate', () => {
  it('returns an empty object for a complete valid form', () => {
    expect(validate(FULL)).toEqual({});
  });

  it('asks for the six required fields when everything is empty', () => {
    const empty = { rol: '', onderwerp: '', gebouw: '', naam: '', bedrijf: '', email: '', telefoon: '', bericht: '' };
    expect(validate(empty)).toEqual({
      rol: MSG.nl.rol,
      onderwerp: MSG.nl.onderwerp,
      naam: MSG.nl.naam,
      bedrijf: MSG.nl.bedrijf,
      email: MSG.nl.emailLeeg,
      bericht: MSG.nl.bericht,
    });
  });

  it('gives the same six messages in English when asked for English', () => {
    const empty = { rol: '', onderwerp: '', gebouw: '', naam: '', bedrijf: '', email: '', telefoon: '', bericht: '' };
    expect(validate(empty, 'en')).toEqual({
      rol: MSG.en.rol,
      onderwerp: MSG.en.onderwerp,
      naam: MSG.en.naam,
      bedrijf: MSG.en.bedrijf,
      email: MSG.en.emailLeeg,
      bericht: MSG.en.bericht,
    });
  });

  it('defaults to Dutch when no language is given', () => {
    expect(validate({ ...FULL, naam: '' }).naam).toBe(MSG.nl.naam);
    expect(validate({ ...FULL, naam: '' }, 'nl').naam).toBe(MSG.nl.naam);
  });

  it.each(['naam', 'bedrijf', 'bericht'])('treats whitespace-only %s as empty', (field) => {
    expect(validate({ ...FULL, [field]: '   \t ' })[field]).toBe(MSG.nl[field]);
  });

  it('treats a whitespace-only email address as empty', () => {
    expect(validate({ ...FULL, email: '   ' }).email).toBe(MSG.nl.emailLeeg);
  });

  it.each(['naam@bedrijf', 'naam bedrijf@voorbeeld.nl', '@voorbeeld.nl', 'naam@.nl', 'naam@@voorbeeld.nl'])(
    'rejects the email address %j with the invalid-address message in both languages',
    (email) => {
      expect(validate({ ...FULL, email }).email).toBe(MSG.nl.emailFout);
      expect(validate({ ...FULL, email }, 'en').email).toBe(MSG.en.emailFout);
    },
  );

  it('accepts an email address with surrounding whitespace', () => {
    expect(validate({ ...FULL, email: '  jan@voorbeeld.nl ' })).toEqual({});
  });

  it.each(['12ab', '1234567', '06 1234 5678 ext', '06.12345678'])('rejects the phone number %j', (telefoon) => {
    expect(validate({ ...FULL, telefoon }).telefoon).toBe(MSG.nl.telefoon);
    expect(validate({ ...FULL, telefoon }, 'en').telefoon).toBe(MSG.en.telefoon);
  });

  it.each(['', '   ', '06 12345678', '+31 (0)20-123 4567', '12345678'])('accepts the phone number %j', (telefoon) => {
    expect(validate({ ...FULL, telefoon })).toEqual({});
  });

  it('does not require the building type', () => {
    expect(validate({ ...FULL, gebouw: '' })).toEqual({});
  });

  it.each(['kantoor', 'appartement', 'businesscenter', 'anders', 'onzin'])(
    'never marks the building type %j invalid',
    (gebouw) => {
      expect(validate({ ...FULL, gebouw })).not.toHaveProperty('gebouw');
      expect(validate({ ...FULL, gebouw })).toEqual({});
    },
  );

  it.each(['eigenaar', 'beheerder', 'vve'])('accepts the role %s', (rol) => {
    expect(validate({ ...FULL, rol })).toEqual({});
  });

  it('rejects a resident with the resident message and nothing else', () => {
    expect(validate({ ...FULL, rol: 'bewoner' })).toEqual({ rol: MSG.nl.rolBewoner });
    expect(validate({ ...FULL, rol: 'bewoner' }, 'en')).toEqual({ rol: MSG.en.rolBewoner });
  });

  it('asks for the role rather than sending a resident message when the role is empty', () => {
    expect(validate({ ...FULL, rol: '' })).toEqual({ rol: MSG.nl.rol });
  });

  it.each(['partner', 'storing', 'vraag'])('accepts the request type %s', (onderwerp) => {
    expect(validate({ ...FULL, onderwerp })).toEqual({});
  });

  it('rejects a request type that is not one of the three options', () => {
    expect(validate({ ...FULL, onderwerp: 'anders' }).onderwerp).toBe(MSG.nl.onderwerp);
  });
});

describe('buildMailto', () => {
  it.each(['nl', 'en'])('returns exactly subject, body and href in %s', (taal) => {
    expect(Object.keys(buildMailto(FULL, taal)).sort()).toEqual(['body', 'href', 'subject']);
  });

  it('builds the spec subject and body for the full Dutch example', () => {
    const result = buildMailto(FULL);
    expect(result.subject).toBe('Kennismaking of offerte via de website: Multi-tenant kantoorgebouw');
    expect(result.body).toBe(FULL_BODY.nl);
  });

  it('builds the same message with English subject and labels for English', () => {
    const result = buildMailto(FULL, 'en');
    expect(result.subject).toBe('Introduction or quote via the website: Multi-tenant office building');
    expect(result.body).toBe(FULL_BODY.en);
  });

  it('starts the href exactly as the spec shows', () => {
    expect(
      buildMailto(FULL).href.startsWith(
        'mailto:info@newconet.nl?subject=Kennismaking%20of%20offerte%20via%20de%20website%3A%20Multi-tenant%20kantoorgebouw&body=Rol%3A%20Eigenaar%20van%20het%20gebouw%0D%0A',
      ),
    ).toBe(true);
  });

  it.each(['nl', 'en'])('encodes subject and body with encodeURIComponent and never a plus for a space in %s', (taal) => {
    const { subject, body, href } = buildMailto(FULL, taal);
    expect(href).toBe(`${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    expect(href).not.toContain('+');
  });

  const subjectCases = ['nl', 'en'].flatMap((taal) =>
    ['partner', 'storing', 'vraag'].map((onderwerp) => [taal, onderwerp, ONDERWERPEN[taal][onderwerp]]),
  );

  it.each(subjectCases)('uses the %s subject and first topic label for %s', (taal, onderwerp, expected) => {
    const result = buildMailto({ ...FULL, onderwerp, gebouw: '' }, taal);
    expect(result.subject).toBe(expected.subject);
    expect(result.body.split('\r\n')[1]).toBe(`${REGELS[taal].onderwerp}: ${expected.label}`);
  });

  const buildingCases = ['nl', 'en'].flatMap((taal) =>
    ['kantoor', 'appartement', 'businesscenter'].map((gebouw) => [taal, gebouw, GEBOUWEN[taal][gebouw]]),
  );

  it.each(buildingCases)('appends the %s label of building %s to the subject after a colon', (taal, gebouw, label) => {
    const result = buildMailto({ ...FULL, gebouw }, taal);
    expect(result.subject).toBe(`${ONDERWERPEN[taal].partner.subject}: ${label}`);
    expect(result.body).toContain(`${REGELS[taal].gebouw}: ${label}\r\n`);
  });

  it.each(['nl', 'en'])('adds no building suffix to the subject for "anders" in %s but keeps the body line', (taal) => {
    const result = buildMailto({ ...FULL, gebouw: 'anders' }, taal);
    expect(result.subject).toBe(ONDERWERPEN[taal].partner.subject);
    expect(result.body).toContain(`${REGELS[taal].gebouw}: ${GEBOUWEN[taal].anders}\r\n`);
  });

  it.each(['nl', 'en'])('leaves out the Gebouw and Telefoon lines when those fields are empty in %s', (taal) => {
    const r = REGELS[taal];
    const { subject, body } = buildMailto({ ...FULL, gebouw: '', telefoon: '' }, taal);
    expect(subject).toBe(ONDERWERPEN[taal].partner.subject);
    expect(body).toBe(
      [
        `${r.rol}: ${ROLLEN[taal].eigenaar}`,
        `${r.onderwerp}: ${ONDERWERPEN[taal].partner.label}`,
        `${r.naam}: Jan de Vries`,
        `${r.organisatie}: Voorbeeld Vastgoed BV`,
        `${r.email}: jan@voorbeeld.nl`,
        '',
        `${r.bericht}:`,
        FULL.bericht,
      ].join('\r\n'),
    );
  });

  it.each([
    ['eigenaar', 'nl'],
    ['beheerder', 'nl'],
    ['vve', 'nl'],
    ['eigenaar', 'en'],
    ['beheerder', 'en'],
    ['vve', 'en'],
  ])('writes the visible label of role %s in %s', (rol, taal) => {
    expect(buildMailto({ ...FULL, rol }, taal).body.split('\r\n')[0]).toBe(`${REGELS[taal].rol}: ${ROLLEN[taal][rol]}`);
  });

  it('defaults to Dutch when no language is given', () => {
    expect(buildMailto(FULL)).toEqual(buildMailto(FULL, 'nl'));
  });

  it('joins every body line with CRLF and never a bare line feed', () => {
    const { body } = buildMailto({ ...FULL, bericht: 'regel een\nregel twee' });
    expect(body.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    expect(body.endsWith('Bericht:\r\nregel een\r\nregel twee')).toBe(true);
  });

  it('trims surrounding whitespace from every value in the body', () => {
    const { body } = buildMailto({ ...FULL, naam: '  Jan de Vries ', bedrijf: ' Voorbeeld Vastgoed BV  ', bericht: ' Hallo \n' });
    expect(body).toContain('Naam: Jan de Vries\r\n');
    expect(body).toContain('Organisatie: Voorbeeld Vastgoed BV\r\n');
    expect(body.endsWith('Bericht:\r\nHallo')).toBe(true);
  });
});

describe('buildMailto with hostile input', () => {
  const hostile = [
    ['ampersand', 'Jan & Piet'],
    ['hash', 'Kamer #4'],
    ['percent', '100% zeker %0D%0A'],
    ['question mark', 'Wat? Waarom?'],
    ['equals sign', 'a=b&body=nep'],
    ['line breaks', 'regel een\r\nregel twee\nregel drie'],
    ['script tag', '<script>alert(1)</script>'],
    ['subject injection', 'x&subject=Nep'],
  ];
  const cases = ['naam', 'bedrijf', 'bericht'].flatMap((field) => hostile.map(([label, value]) => [field, label, value]));

  it.each(cases)('keeps %s value with %s intact in the decoded body', (field, _label, value) => {
    const fields = { ...FULL, [field]: value };
    const { href, body } = buildMailto(fields);
    const literal = {
      naam: `Naam: ${fields.naam}`,
      bedrijf: `Organisatie: ${fields.bedrijf}`,
      bericht: `Bericht:\r\n${fields.bericht.replace(/\r?\n/g, '\r\n')}`,
    }[field];
    expect(body).toContain(literal);
    expect(decode(href).body).toBe(body);
    expect(href.split('?subject=')).toHaveLength(2);
    expect(href.split('&body=')).toHaveLength(2);
    expect(href.split('?')).toHaveLength(2);
  });
});

describe('the dense form case', () => {
  it('carries a 1500-character message, a long organisation and Businesscenter', () => {
    const bericht = 'x'.repeat(1499) + '&';
    expect(bericht).toHaveLength(1500);
    const fields = {
      ...FULL,
      gebouw: 'businesscenter',
      bedrijf: 'Een Zeer Lange Organisatienaam BV '.repeat(4).trim(),
      bericht,
    };
    expect(validate(fields)).toEqual({});
    const { href, body } = buildMailto(fields);
    expect(href).toContain('subject=Kennismaking%20of%20offerte%20via%20de%20website%3A%20Businesscenter&body=');
    const decoded = decode(href);
    expect(decoded.subject).toBe('Kennismaking of offerte via de website: Businesscenter');
    expect(decoded.body).toBe(body);
    expect(decoded.body.endsWith(`Bericht:\r\n${bericht}`)).toBe(true);
  });
});

// ---------------------------------------------------------------- DOM wiring

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const visibleText = (node) => {
  if (node.nodeType === 3) return node.data;
  if (node.nodeType !== 1 || node.getAttribute('aria-hidden') === 'true') return '';
  return [...node.childNodes].map(visibleText).join('');
};
const nameOf = (el) => norm(el.getAttribute('aria-label') ?? visibleText(el));
const squash = (s) => s.replace(/\s+/g, '');
const controlName = (el) => {
  const by = el.getAttribute('aria-labelledby');
  if (by) return norm(by.split(/\s+/).map((id) => visibleText(el.ownerDocument.getElementById(id))).join(' '));
  if (el.getAttribute('aria-label')) return norm(el.getAttribute('aria-label'));
  if (el.labels?.length) return norm([...el.labels].map(visibleText).join(' '));
  if (el.tagName === 'BUTTON') return nameOf(el);
  return '';
};

const openDoms = [];
afterEach(() => {
  while (openDoms.length) openDoms.pop().window.close();
});

const DENIED = () => {
  throw new Error('storage denied');
};

/**
 * Loads the real index.html. `search` is appended to the page URL, `stored` seeds the language key,
 * and `storage` swaps localStorage for one whose methods throw, or whose getter throws.
 */
function loadPage({ clipboard, jaarFallback, search = '', stored, storage } = {}) {
  let html = readFileSync(INDEX_HTML, 'utf8');
  if (jaarFallback) {
    html = html.replace(/(<span[^>]*id="jaar"[^>]*>)[^<]*(<\/span>)/, (_, a, b) => `${a}${jaarFallback}${b}`);
  }
  const dom = new JSDOM(html, {
    url: `${PAGE_URL}${search}`,
    pretendToBeVisual: true,
    beforeParse(window) {
      if (storage === 'methods-throw') {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get: () => ({ getItem: DENIED, setItem: DENIED, removeItem: DENIED }),
        });
      }
      if (storage === 'getter-throws') {
        Object.defineProperty(window, 'localStorage', { configurable: true, get: DENIED });
      }
    },
  });
  openDoms.push(dom);
  const doc = dom.window.document;
  if (stored !== undefined) dom.window.localStorage.setItem(STORAGE_KEY, stored);
  const navigate = vi.fn();
  init(doc, { navigate, clipboard });
  return { doc, win: dom.window, navigate };
}

const $ = (scope, selector) => scope.querySelector(selector);
const $$ = (scope, selector) => [...scope.querySelectorAll(selector)];
const byKey = (doc, key) => $(doc, `[data-i18n="${key}"], [data-i18n-aria="${key}"]`);
const link = (scope, name) => {
  const found = $$(scope, 'a').filter((a) => nameOf(a) === name);
  expect(found, `link named "${name}"`).toHaveLength(1);
  return found[0];
};
const radio = (doc, value) => {
  const el = $(doc, `input[name="onderwerp"][value="${value}"]`);
  expect(el, `radio ${value}`).not.toBeNull();
  return el;
};
const status = (doc) => $(doc, '#formulier-status');
const form = (doc) => $(doc, 'form#contactformulier');
const submitButton = (doc) => {
  const button = $(form(doc), 'button[type="submit"]');
  expect(button, 'submit button').not.toBeNull();
  return button;
};
const langButton = (doc) => {
  const button = $(doc, 'button#taal-toggle');
  expect(button, 'button#taal-toggle').not.toBeNull();
  return button;
};
const menuToggle = (doc) => $(doc, 'button#nav-toggle');
const flip = (doc) => langButton(doc).click();
const pageLang = (doc) => doc.documentElement.getAttribute('lang');

function type(doc, selector, value) {
  const el = $(doc, selector);
  expect(el, selector).not.toBeNull();
  el.value = value;
  el.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
  el.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
}
function fillForm(doc, fields = FULL) {
  type(doc, '#gebouw', fields.gebouw);
  type(doc, '#naam', fields.naam);
  type(doc, '#bedrijf', fields.bedrijf);
  type(doc, '#email', fields.email);
  type(doc, '#telefoon', fields.telefoon);
  type(doc, '#bericht', fields.bericht);
  if (fields.onderwerp) radio(doc, fields.onderwerp).click();
  type(doc, '#rol', fields.rol);
}
const submit = (doc) => submitButton(doc).click();
const isInvalid = (el) => el.getAttribute('aria-invalid') === 'true';
const FIELD_ORDER = ['rol', 'onderwerp', 'naam', 'bedrijf', 'email', 'telefoon', 'bericht'];

// ---------------------------------------------------------------- the copy tables

describe('the Dutch copy in index.html', () => {
  it.each(COPY)('carries the spec copy of %s on %s', (key, selector, aria, nl) => {
    const { doc } = loadPage();
    const attribute = aria ? 'data-i18n-aria' : 'data-i18n';
    const found = $$(doc, `[${attribute}="${key}"]`);
    expect(found, `elements with ${attribute}="${key}"`).toHaveLength(1);
    expect(found[0].matches(selector), `${key} matches ${selector}`).toBe(true);
    if (aria) expect(found[0].getAttribute('aria-label')).toBe(nl);
    else expect(norm(found[0].innerHTML)).toBe(norm(nl));
  });

  it('marks up no key on both data-i18n and data-i18n-aria, and no key the tables do not list', () => {
    const { doc } = loadPage();
    const known = new Set(COPY.map((row) => row[0]));
    const used = [...$$(doc, '[data-i18n]').map((el) => el.dataset.i18n), ...$$(doc, '[data-i18n-aria]').map((el) => el.getAttribute('data-i18n-aria'))];
    expect(used.filter((key) => !known.has(key))).toEqual([]);
    expect(used).toHaveLength(new Set(used).size);
    expect(used).toHaveLength(COPY.length);
  });

  it('uses the spec title and meta description', () => {
    const { doc } = loadPage();
    expect(doc.title).toBe(TITLE_NL);
    expect($(doc, 'meta[name="description"]').getAttribute('content')).toBe(META_DESCRIPTION);
  });
});

// ---------------------------------------------------------------- page structure

const LINKS = [
  // key, href, data-onderwerp, data-gebouw (null: absent, undefined: the spec contradicts itself), classes
  ['headerStoring', '#storing', null, null, ['btn', 'btn-alert', 'btn-small']],
  ['headerCta', '#contact', null, null, ['btn', 'btn-primary', 'btn-small', 'btn-quote']],
  ['heroCta1', '#contactformulier', 'partner', null, ['btn', 'btn-primary']],
  ['heroCta2', '#diensten', null, null, ['btn', 'btn-secondary']],
  ['routeKantoorKnop', '#contactformulier', 'partner', 'kantoor', ['btn', 'btn-primary']],
  ['routeAppKnop', '#contactformulier', 'partner', 'appartement', ['btn', 'btn-secondary']],
  ['belKnop', TEL, null, null, ['btn', 'btn-alert']],
  ['dienst1Link', '#contactformulier', 'partner', 'kantoor', ['dienst-link']],
  ['dienst2Link', '#contactformulier', 'partner', 'appartement', ['dienst-link']],
  ['dienstWifiLink', '#contactformulier', 'partner', null, ['dienst-link']],
  ['dienstMaatwerkLink', '#contactformulier', 'partner', 'businesscenter', ['dienst-link']],
  ['dienst3Link', '#contactformulier', 'partner', null, ['dienst-link']],
  ['dienst4Link', '#contactformulier', 'partner', null, ['dienst-link']],
  ['dienst5Link', '#contactformulier', 'vraag', null, ['dienst-link']],
  ['dienst6Link', '#contactformulier', 'partner', null, ['dienst-link']],
  ['voorWie1Knop', '#contactformulier', 'partner', 'kantoor', ['btn', 'btn-primary']],
  ['voorWie2Knop', '#contactformulier', 'partner', 'appartement', ['btn', 'btn-secondary']],
  ['werkwijzeKnop', '#contactformulier', 'partner', null, ['btn', 'btn-primary']],
  ['belKnop2', TEL, null, null, ['btn', 'btn-alert']],
  ['belKnop3', TEL, null, null, ['btn', 'btn-alert']],
  ['barBellen', TEL, null, null, []],
  ['barMailen', MAIL, null, null, []],
  ['barContact', '#contactformulier', 'partner', null, ['contact-bar-offerte']],
  ['navDiensten', '#diensten', null, null, []],
  ['navVoorWie', '#voor-wie', null, null, []],
  ['navWerkwijze', '#werkwijze', null, null, []],
  ['navOverOns', '#over-ons', null, null, []],
  ['navVragen', '#vragen', null, null, []],
  ['navDiensten2', '#diensten', null, null, []],
  ['navVoorWie2', '#voor-wie', null, null, []],
  ['navWerkwijze2', '#werkwijze', null, null, []],
  ['navOverOns2', '#over-ons', null, null, []],
  ['navVragen2', '#vragen', null, null, []],
  ['navContact2', '#contact', null, null, []],
  ['skip', '#inhoud', null, null, ['skip-link']],
];

describe('page structure', () => {
  it('declares Dutch as the page language and loads the one module script and stylesheet', () => {
    const { doc } = loadPage();
    expect(pageLang(doc)).toBe('nl');
    expect($(doc, 'script[type="module"][src="js/main.js"]')).not.toBeNull();
    expect($(doc, 'link[rel="stylesheet"][href="css/style.css"]')).not.toBeNull();
    expect($$(doc, 'script[src^="http"], link[href^="http"], link[href^="//"]')).toHaveLength(0);
  });

  it('holds one header, one main#inhoud with tabindex -1 and one footer', () => {
    const { doc } = loadPage();
    expect($$(doc, 'header')).toHaveLength(1);
    expect($$(doc, 'main')).toHaveLength(1);
    expect($(doc, 'main#inhoud').getAttribute('tabindex')).toBe('-1');
    expect($$(doc, 'footer')).toHaveLength(1);
  });

  it('orders the skip link, header, main, footer and sticky bar', () => {
    const { doc } = loadPage();
    const parts = ['a.skip-link', 'header.site-header', 'main#inhoud', 'footer.site-footer', 'nav.contact-bar'].map((s) => $(doc, s));
    parts.forEach((part, i) => expect(part, `part ${i}`).not.toBeNull());
    for (let i = 1; i < parts.length; i += 1) {
      expect(parts[i - 1].compareDocumentPosition(parts[i]) & 4, `part ${i} follows part ${i - 1}`).toBeTruthy();
    }
  });

  it('puts the skip link first in the tab order, pointing at #inhoud', () => {
    const { doc } = loadPage();
    const first = $$(doc, 'a[href], button')[0];
    expect(nameOf(first)).toBe('Direct naar de inhoud');
    expect(first.getAttribute('href')).toBe('#inhoud');
    expect(first.classList.contains('skip-link')).toBe(true);
  });

  it('orders the nine sections inside main with the spec ids and classes', () => {
    const { doc } = loadPage();
    const sections = $$(doc, 'main#inhoud section[id]');
    expect(sections.map((s) => s.id)).toEqual([
      'top',
      'wat-wilt-u-doen',
      'diensten',
      'voor-wie',
      'werkwijze',
      'over-ons',
      'vragen',
      'storing',
      'contact',
    ]);
    ['hero', 'routes', 'diensten', 'voor-wie', 'werkwijze', 'over-ons', 'faq', 'storing', 'contact'].forEach((cls, i) => {
      expect(sections[i].classList.contains(cls), `section ${sections[i].id} has class ${cls}`).toBe(true);
    });
  });

  it('shows the exact h1 and the exact h2 of every section', () => {
    const { doc } = loadPage();
    expect($$(doc, 'h1')).toHaveLength(1);
    expect($(doc, 'h1').textContent).toBe('Internet voor het hele gebouw. Geregeld door één partner.');
    expect($$(doc, 'main h2').map((h) => h.textContent.trim())).toEqual([
      'Wat wilt u doen?',
      'Onze diensten',
      'Voor wie wij werken',
      'Zo werken wij',
      'Over NewCONet',
      'Veelgestelde vragen',
      'Storing? Bel ons op werkdagen',
      'Neem contact op',
    ]);
    expect($$(doc, 'footer.site-footer h2').map((h) => h.textContent.trim())).toEqual(['Contact', 'Snel naar']);
  });

  it('labels the three navigation landmarks distinctly', () => {
    const { doc } = loadPage();
    expect($$(doc, 'nav').map((n) => n.getAttribute('aria-label')).sort()).toEqual(['Hoofdmenu', 'Snel contact', 'Voettekst']);
  });

  it('gives the logo link its accessible name and #top target', () => {
    const { doc } = loadPage();
    const logo = $(doc, 'header a.logo');
    expect(logo.getAttribute('href')).toBe('#top');
    expect(logo.getAttribute('aria-label')).toBe('NewCONet, naar het begin van de pagina');
  });

  it.each(LINKS.filter(([, href]) => href !== null))('gives %s the target %s and the spec data attributes', (key, href, onderwerp, gebouw, classes) => {
    const { doc } = loadPage();
    const anchor = byKey(doc, key);
    expect(anchor.getAttribute('href')).toBe(href);
    for (const cls of classes) expect(anchor.classList.contains(cls), `${key}.${cls}`).toBe(true);
    if (onderwerp === null) expect(anchor.hasAttribute('data-onderwerp')).toBe(false);
    else expect(anchor.dataset.onderwerp).toBe(onderwerp);
    if (gebouw === null) expect(anchor.hasAttribute('data-gebouw')).toBe(false);
    else if (gebouw !== undefined) expect(anchor.dataset.gebouw).toBe(gebouw);
  });
});

describe('the header', () => {
  it('orders the logo, main nav, header actions and menu toggle', () => {
    const { doc } = loadPage();
    const parts = ['a.logo', 'nav#hoofdmenu.main-nav', 'div.header-actions', 'button#nav-toggle.nav-toggle'].map((s) => $(doc, `header ${s}`));
    parts.forEach((part, i) => expect(part, `header part ${i}`).not.toBeNull());
    for (let i = 1; i < parts.length; i += 1) {
      expect(parts[i - 1].compareDocumentPosition(parts[i]) & 4).toBeTruthy();
    }
  });

  it('holds exactly five menu links and no Contact link', () => {
    const { doc } = loadPage();
    expect($$(doc, 'nav#hoofdmenu a').map((a) => [nameOf(a), a.getAttribute('href')])).toEqual([
      ['Diensten', '#diensten'],
      ['Voor wie', '#voor-wie'],
      ['Werkwijze', '#werkwijze'],
      ['Over ons', '#over-ons'],
      ['Vragen', '#vragen'],
    ]);
  });

  it('puts the language button first in the header actions, followed by Storing? and Neem contact op', () => {
    const { doc } = loadPage();
    const actions = $(doc, 'header div.header-actions');
    expect(actions.firstElementChild).toBe(langButton(doc));
    expect(actions.firstElementChild.textContent.trim()).toBe('EN');
    expect([...actions.children].map((el) => nameOf(el))).toEqual(['Switch to English (EN)', 'Storing?', 'Neem contact op']);
  });

  it('builds the language button as a small secondary button with a hidden globe and a text span', () => {
    const { doc } = loadPage();
    const button = langButton(doc);
    for (const cls of ['btn', 'btn-secondary', 'btn-small', 'taal-toggle']) expect(button.classList.contains(cls)).toBe(true);
    expect(button.getAttribute('type')).toBe('button');
    expect($(button, 'svg').getAttribute('aria-hidden')).toBe('true');
    expect($(button, 'span#taal-toggle-tekst').textContent).toBe('EN');
    expect(button.hasAttribute('data-i18n')).toBe(false);
    expect(button.hasAttribute('data-i18n-aria')).toBe(false);
    expect($(button, '#taal-toggle-tekst').hasAttribute('data-i18n')).toBe(false);
  });

  it('shows EN with lang en and the English label on the Dutch page', () => {
    const { doc } = loadPage();
    expect($(doc, '#taal-toggle-tekst').textContent).toBe(TAAL_KNOP.nl.tekst);
    expect(langButton(doc).getAttribute('lang')).toBe(TAAL_KNOP.nl.lang);
    expect(langButton(doc).getAttribute('aria-label')).toBe(TAAL_KNOP.nl.label);
  });

  it('wires the menu toggle to the main menu, closed, with three bars', () => {
    const { doc } = loadPage();
    expect(menuToggle(doc).getAttribute('aria-controls')).toBe('hoofdmenu');
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(menuToggle(doc).getAttribute('aria-label')).toBe('Menu openen');
  });
});

describe('the hero', () => {
  it('holds the text column and a figure with the illustration named by its title', () => {
    const { doc } = loadPage();
    const grid = $(doc, 'section.hero#top div.container.hero-grid');
    expect(grid.children).toHaveLength(2);
    expect($(grid, 'figure.hero-visual')).not.toBeNull();
    const svg = $(grid, 'figure.hero-visual svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-labelledby')).toBe('hero-visual-titel');
    expect(svg.firstElementChild.localName).toBe('title');
    expect(svg.firstElementChild.id).toBe('hero-visual-titel');
  });

  it('follows the figure with a legend of four items', () => {
    const { doc } = loadPage();
    expect($$(doc, 'figure.hero-visual figcaption ol.hero-legenda > li')).toHaveLength(4);
  });

  it('keeps the two-week note free of links', () => {
    const { doc } = loadPage();
    const note = $(doc, 'p.hero-noot');
    expect($$(note, 'a')).toHaveLength(0);
    expect($(note, 'strong').textContent).toBe('binnen twee weken');
  });
});

describe('the route chooser', () => {
  it('offers three route cards with the exact h3s, the third marked as the outage card', () => {
    const { doc } = loadPage();
    const cards = $$(doc, 'section#wat-wilt-u-doen div.routes-grid > article.route-card');
    expect(cards).toHaveLength(3);
    expect(cards.map((card) => $(card, 'h3').textContent.trim())).toEqual([
      'Multi-tenant kantoorgebouw',
      'Compleet appartementencomplex',
      'Klant met een storing of vraag',
    ]);
    expect(cards[2].classList.contains('route-card--storing')).toBe(true);
    expect(cards[0].classList.contains('route-card--storing')).toBe(false);
  });

  it('puts the mail link and the resident referral under the call button of the third card', () => {
    const { doc } = loadPage();
    const card = $(doc, 'article.route-card--storing');
    const extras = $$(card, 'p.route-extra');
    expect(extras).toHaveLength(2);
    expect(link(extras[0], 'info@newconet.nl').getAttribute('href')).toBe(MAIL);
    expect($$(extras[1], 'a')).toHaveLength(0);
    expect(link(card, `Bel ${PHONE}`).getAttribute('href')).toBe(TEL);
  });
});

describe('the services', () => {
  it('holds eight service cards, the first featured with a badge', () => {
    const { doc } = loadPage();
    const cards = $$(doc, 'section#diensten div.diensten-grid > article.dienst-card');
    expect(cards).toHaveLength(8);
    expect(cards[0].classList.contains('dienst-card--uitgelicht')).toBe(true);
    expect($(cards[0], 'p.badge').textContent.trim()).toBe('Ons specialisme');
    expect(cards.slice(1).some((card) => card.classList.contains('dienst-card--uitgelicht'))).toBe(false);
    expect(cards.slice(1).some((card) => $(card, 'p.badge'))).toBe(false);
  });

  it('titles the cards in the spec order', () => {
    const { doc } = loadPage();
    expect($$(doc, 'article.dienst-card h3').map((h) => h.textContent.trim())).toEqual([
      'Internet voor multi-tenant kantoorgebouwen',
      'Internet voor complete appartementencomplexen',
      'Wifi in de algemene delen',
      'Hoogwaardige wifi op maat',
      'Internet voor gebouwgebonden systemen',
      'Partner voor eigenaren, beheerders en VvE’s',
      'Ondersteuning en onderhoud',
      'Nieuwe huurders snel online',
    ]);
  });

  it('starts every card with a hidden icon and ends it with a link that has a hidden suffix', () => {
    const { doc } = loadPage();
    for (const card of $$(doc, 'article.dienst-card')) {
      expect(card.firstElementChild.classList.contains('dienst-icon')).toBe(true);
      expect(card.firstElementChild.getAttribute('aria-hidden')).toBe('true');
      expect(card.lastElementChild.classList.contains('dienst-link')).toBe(true);
      expect($(card.lastElementChild, 'span.visually-hidden')).not.toBeNull();
    }
  });

  it('gives every service link a unique accessible name', () => {
    const { doc } = loadPage();
    const names = $$(doc, 'a.dienst-link').map(nameOf);
    expect(names).toHaveLength(8);
    expect(new Set(names).size).toBe(8);
    expect(names[0]).toBe('Offerte aanvragen voor internet in een multi-tenant kantoorgebouw');
  });
});

describe('who we serve', () => {
  it('holds three persona cards and two who-we-serve cards with the exact h3s', () => {
    const { doc } = loadPage();
    const section = $(doc, 'section.voor-wie#voor-wie');
    const personas = $$(section, 'div.persona-grid > article.persona-card');
    expect(personas.map((c) => $(c, 'h3').textContent.trim())).toEqual(['Eigenaren', 'Beheerders', 'VvE’s']);
    for (const card of personas) {
      expect(card.firstElementChild.classList.contains('dienst-icon')).toBe(true);
      expect(card.firstElementChild.getAttribute('aria-hidden')).toBe('true');
    }
    const cards = $$(section, 'div.voor-wie-grid > article.voor-wie-card');
    expect(cards.map((c) => $(c, 'h3').textContent.trim())).toEqual(['Multi-tenant kantoorgebouwen', 'Complete appartementencomplexen']);
  });

  it('starts each card with a hidden drawing and puts the body in div.voor-wie-body', () => {
    const { doc } = loadPage();
    for (const card of $$(doc, 'article.voor-wie-card')) {
      const figure = card.firstElementChild;
      expect(figure.matches('figure.voor-wie-visual')).toBe(true);
      expect(figure.getAttribute('aria-hidden')).toBe('true');
      expect($(card, 'div.voor-wie-body ul.over-ons-punten')).not.toBeNull();
    }
  });

  it('gives the office drawing four tenant labels and the speciality badge', () => {
    const { doc } = loadPage();
    const [office, apartment] = $$(doc, 'article.voor-wie-card');
    expect($(office, 'div.voor-wie-body p.badge').textContent.trim()).toBe('Ons specialisme');
    expect($(apartment, 'p.badge')).toBeNull();
    expect($$(office, 'figure svg text').map((t) => t.textContent.trim())).toEqual(expect.arrayContaining(['Huurder A', 'Huurder B', 'Huurder C', 'Huurder D']));
  });

  it('lists the apartment points in the order 1, 4, 2, 3', () => {
    const { doc } = loadPage();
    const apartment = $$(doc, 'article.voor-wie-card')[1];
    expect($$(apartment, 'ul.over-ons-punten > li').map((li) => li.dataset.i18n)).toEqual([
      'voorWie2Punt1',
      'voorWie2Punt4',
      'voorWie2Punt2',
      'voorWie2Punt3',
    ]);
  });
});

describe('the process', () => {
  it('lists five steps, each with an h3 and one paragraph', () => {
    const { doc } = loadPage();
    const steps = $$(doc, 'section#werkwijze ol.stappen > li.stap');
    expect(steps).toHaveLength(5);
    expect(steps.map((s) => $(s, 'h3').textContent.trim())).toEqual([
      'Kennismaking',
      'Het gebouw in kaart brengen',
      'Voorstel op maat',
      'Aansluiten',
      'Ondersteuning en onderhoud',
    ]);
    for (const step of steps) expect($$(step, 'p')).toHaveLength(1);
  });
});

describe('about NewCONet', () => {
  it('marks up the stats as a list of three whose numbers are words', () => {
    const { doc } = loadPage();
    const stats = $(doc, 'ul.over-ons-stats');
    expect(stats.getAttribute('role')).toBe('list');
    const items = $$(stats, ':scope > li.stat');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect($(item, 'span.stat-num.stat-num--tekst')).not.toBeNull();
      expect($(item, 'span.stat-label')).not.toBeNull();
    }
  });

  it('lists three points', () => {
    const { doc } = loadPage();
    expect($$(doc, 'section#over-ons ul.over-ons-punten > li')).toHaveLength(3);
  });
});

describe('the FAQ', () => {
  const FAQ_ORDER = COPY.map((row) => row[0]).filter((key) => /^faq\d+[VA]$/.test(key));

  it('holds fourteen items in the spec order, all closed', () => {
    const { doc } = loadPage();
    const items = $$(doc, 'section#vragen details.faq-item');
    expect(items).toHaveLength(14);
    expect(items.every((d) => !d.hasAttribute('open'))).toBe(true);
    expect(items.flatMap((d) => [$(d, 'summary').dataset.i18n, $(d, ':scope > p').dataset.i18n])).toEqual(FAQ_ORDER);
    for (const item of items) expect($$(item, ':scope > p')).toHaveLength(1);
  });

  it('links the intro to the form as a general question', () => {
    const { doc } = loadPage();
    const anchor = $(byKey(doc, 'faqIntro'), 'a');
    expect(anchor.getAttribute('href')).toBe('#contactformulier');
    expect(anchor.dataset.onderwerp).toBe('vraag');
  });
});

describe('the outage band', () => {
  it('orders the h2, a paragraph, the SLA line, the resident line and the call button', () => {
    const { doc } = loadPage();
    const band = $(doc, 'section.storing#storing');
    expect([...band.querySelectorAll('h2, p, a.btn')].map((el) => el.dataset.i18n ?? el.tagName.toLowerCase())).toEqual([
      'storingTitel',
      'storingTekst',
      'storingKern',
      'storingBewoner',
      'belKnop2',
    ]);
    expect($(band, 'p.storing-kern').dataset.i18n).toBe('storingKern');
    expect(link(band, `Bel ${PHONE}`).classList.contains('btn-alert')).toBe(true);
  });
});

describe('the contact section', () => {
  it('puts the resident notice between the intro and the details list', () => {
    const { doc } = loadPage();
    const info = $(doc, 'section.contact div.contact-info');
    const order = [...info.children].map((el) => el.dataset.i18n ?? el.className);
    const intro = order.indexOf('contactIntro');
    const notice = order.indexOf('contactBewoner');
    const details = order.findIndex((entry) => String(entry).includes('contact-details'));
    expect(intro).toBeGreaterThanOrEqual(0);
    expect(notice).toBe(intro + 1);
    expect(details).toBeGreaterThan(notice);
    expect($(info, 'p.contact-bewoner').dataset.i18n).toBe('contactBewoner');
  });

  it('lists phone, email and hours in a list role', () => {
    const { doc } = loadPage();
    const list = $(doc, 'section.contact ul.contact-details');
    expect(list.getAttribute('role')).toBe('list');
    const items = $$(list, ':scope > li');
    expect(items).toHaveLength(3);
    expect(items.map((li) => $(li, 'strong').textContent.trim())).toEqual(['Telefoon', 'E-mail', 'Bereikbaarheid']);
    expect(link(items[0], PHONE).getAttribute('href')).toBe(TEL);
    expect($(items[0], 'span.detail-hint').textContent.trim()).toBe('Op werkdagen van 08:30 tot 17:30');
    expect(link(items[1], 'info@newconet.nl').getAttribute('href')).toBe(MAIL);
    expect(norm(items[2].textContent)).toContain('Ma–vr: 08:30–17:30');
  });
});

describe('the footer', () => {
  it('repeats phone, email, hours and the SLA line', () => {
    const { doc } = loadPage();
    const footer = $(doc, 'footer.site-footer');
    const text = norm(footer.textContent);
    expect(text).toContain(`Telefoon: ${PHONE}`);
    expect(text).toContain('E-mail: info@newconet.nl');
    expect(text).toContain('Ma–vr: 08:30–17:30');
    expect(text).toContain('Ruimere SLA op aanvraag');
    expect(link(footer, PHONE).getAttribute('href')).toBe(TEL);
    expect(link(footer, 'info@newconet.nl').getAttribute('href')).toBe(MAIL);
  });

  it('holds only phone, email, hours and the SLA line in its contact list', () => {
    const { doc } = loadPage();
    const items = $$(doc, 'footer.site-footer ul[role="list"]:not(.footer-nav ul)').flatMap((ul) => $$(ul, ':scope > li'));
    expect(items.map((li) => norm(li.textContent))).toEqual([
      `Telefoon: ${PHONE}`,
      'E-mail: info@newconet.nl',
      'Ma–vr: 08:30–17:30',
      'Ruimere SLA op aanvraag',
    ]);
  });

  it('lays out the brand, the contact list and the six quick links', () => {
    const { doc } = loadPage();
    const footer = $(doc, 'footer.site-footer');
    expect($(footer, 'p.footer-logo').innerHTML.replace(/\s+/g, '')).toBe('New<span>CO</span>Net');
    expect($(footer, 'ul[role="list"]')).not.toBeNull();
    expect($$(footer, 'nav.footer-nav[aria-label="Voettekst"] a').map((a) => a.getAttribute('href'))).toEqual([
      '#diensten',
      '#voor-wie',
      '#werkwijze',
      '#over-ons',
      '#vragen',
      '#contact',
    ]);
  });

  it('holds only the copyright paragraph in the footer bottom, without a privacy link', () => {
    const { doc } = loadPage();
    const bottom = $(doc, 'footer div.container.footer-bottom.footer-legal');
    const paragraphs = $$(bottom, ':scope > p');
    expect(paragraphs).toHaveLength(1);
    expect(norm(paragraphs[0].textContent)).toBe(`© ${new Date().getFullYear()} NewCONet. Alle rechten voorbehouden.`);
    expect($$(bottom, 'a')).toHaveLength(0);
  });

  it('sets the copyright year to the current year, replacing the fallback text', () => {
    const { doc } = loadPage({ jaarFallback: '1999' });
    expect($(doc, 'span#jaar').textContent.trim()).toBe(String(new Date().getFullYear()));
    expect(norm($(doc, 'footer.site-footer').textContent)).toContain(`© ${new Date().getFullYear()} NewCONet. Alle rechten voorbehouden.`);
  });

  it('carries the build year as fallback text in the HTML', () => {
    expect(readFileSync(INDEX_HTML, 'utf8')).toMatch(/<span[^>]*id="jaar"[^>]*>\s*20\d\d\s*<\/span>/);
  });
});

describe('the sticky contact bar', () => {
  it('holds Bellen, Mailen and Contact in that order', () => {
    const { doc } = loadPage();
    const bar = $(doc, 'nav.contact-bar');
    expect($$(bar, 'a').map((a) => [nameOf(a), a.getAttribute('href')])).toEqual([
      ['Bellen', TEL],
      ['Mailen', MAIL],
      ['Contact', '#contactformulier'],
    ]);
  });
});

describe('contact details across the page', () => {
  it('uses only the real number and address in every tel: and mailto: link', () => {
    const { doc } = loadPage();
    const tels = $$(doc, 'a[href^="tel:"]');
    expect(tels.length).toBeGreaterThanOrEqual(6);
    expect(new Set(tels.map((a) => a.getAttribute('href')))).toEqual(new Set([TEL]));
    const mails = $$(doc, 'a[href^="mailto:"]');
    expect(mails.length).toBeGreaterThanOrEqual(3);
    expect(mails.every((a) => a.getAttribute('href') === MAIL)).toBe(true);
  });

  it('shows the real phone text wherever a tel: link shows a number', () => {
    const { doc } = loadPage();
    const numeric = $$(doc, 'a[href^="tel:"]').map(nameOf).filter((n) => /\d/.test(n));
    expect(numeric.length).toBeGreaterThan(0);
    expect(numeric.every((n) => n === PHONE || n === `Bel ${PHONE}`)).toBe(true);
  });

  it('gives the outage band and the outage card a call link', () => {
    const { doc } = loadPage();
    expect(link($(doc, 'section.storing#storing'), `Bel ${PHONE}`).getAttribute('href')).toBe(TEL);
    expect(link($(doc, 'article.route-card--storing'), `Bel ${PHONE}`).getAttribute('href')).toBe(TEL);
  });
});

describe('the old positioning stays out', () => {
  const sources = () => [
    ['index.html', readFileSync(INDEX_HTML, 'utf8')],
    ['main.js', readFileSync(MAIN_JS, 'utf8')],
    ['i18n.js', readFileSync(I18N_JS, 'utf8')],
  ];
  const forbidden = [
    ['24/7', /24\/7/],
    ['bedrijventerrein', /bedrijventerrein/i],
    ['the old placeholder phone', /\+31 \(0\)00 000 00 00/],
    ['the old placeholder tel link', /tel:\+31000000000/],
    ['the mock banner', /mock-banner/],
    ['the mock stubs', /mock-todo/],
    ['the address stub', /\[adres invullen\]/],
    ['the placeholder street', /Straatnaam/],
    ['the placeholder town', /Plaatsnaam/],
    ['the placeholder KvK number', /00000000/],
    ['the placeholder btw number', /NL000000000B00/],
    ['a KvK line', /KvK/],
    ['a btw line', /Btw-nummer/],
    ['the old service attribute', /data-dienst/],
  ];
  const cases = forbidden.flatMap(([label, pattern]) => ['index.html', 'main.js', 'i18n.js'].map((file) => [label, file, pattern]));

  it.each(cases)('keeps %s out of %s', (_label, file, pattern) => {
    const source = sources().find(([name]) => name === file)[1];
    expect(source).not.toMatch(pattern);
  });

  it('has no select#dienst and no element with the dienst id or attribute', () => {
    const { doc } = loadPage();
    expect($(doc, 'select#dienst')).toBeNull();
    expect($(doc, '#dienst')).toBeNull();
    expect($$(doc, '[data-dienst]')).toHaveLength(0);
  });

  it('never reads a service select or data-dienst in the script', () => {
    expect(readFileSync(MAIN_JS, 'utf8')).not.toMatch(/dataset\.dienst|getElementById\(['"]dienst['"]\)|#dienst/);
  });

  it('carries no mock banner and no stub elements', () => {
    const { doc } = loadPage();
    expect($$(doc, '.mock-banner, .mock-todo')).toHaveLength(0);
  });

  it('carries no privacy link and no privacy line in the form', () => {
    const { doc } = loadPage();
    expect($$(doc, 'a[href*="privacy" i]')).toHaveLength(0);
    expect($$(doc, '.form-privacy')).toHaveLength(0);
    expect(doc.body.textContent).not.toMatch(/privacy/i);
  });
});

// ---------------------------------------------------------------- the language switch

const snapshot = (doc) => ({
  html: $$(doc, '[data-i18n]').map((el) => [el.dataset.i18n, el.innerHTML]),
  aria: $$(doc, '[data-i18n-aria]').map((el) => [el.getAttribute('data-i18n-aria'), el.getAttribute('aria-label')]),
});
const mismatches = (doc, taal) => {
  const wrong = [];
  for (const [key, , aria, nl, en] of COPY) {
    const expected = taal === 'en' ? en : nl;
    const el = $(doc, `[${aria ? 'data-i18n-aria' : 'data-i18n'}="${key}"]`);
    const actual = el ? (aria ? el.getAttribute('aria-label') : norm(el.innerHTML)) : '(missing)';
    if (actual !== (aria ? expected : norm(expected))) wrong.push(`${key}: ${actual}`);
  }
  return wrong;
};

describe('the language button', () => {
  it.each(['nl', 'en'])('shows %s state text, lang and label after the page opens in that language', (taal) => {
    const { doc } = loadPage({ search: taal === 'en' ? '?lang=en' : '' });
    expect($(doc, '#taal-toggle-tekst').textContent).toBe(TAAL_KNOP[taal].tekst);
    expect(langButton(doc).getAttribute('lang')).toBe(TAAL_KNOP[taal].lang);
    expect(langButton(doc).getAttribute('aria-label')).toBe(TAAL_KNOP[taal].label);
  });

  it('switches its own text, lang and label on every click', () => {
    const { doc } = loadPage();
    flip(doc);
    expect($(doc, '#taal-toggle-tekst').textContent).toBe('NL');
    expect(langButton(doc).getAttribute('lang')).toBe('nl');
    expect(langButton(doc).getAttribute('aria-label')).toBe('Schakel naar Nederlands (NL)');
    flip(doc);
    expect($(doc, '#taal-toggle-tekst').textContent).toBe('EN');
    expect(langButton(doc).getAttribute('lang')).toBe('en');
    expect(langButton(doc).getAttribute('aria-label')).toBe('Switch to English (EN)');
  });
});

describe('switching the page language', () => {
  it('sets html lang, the document title and every marked text and label to English', () => {
    const { doc } = loadPage();
    flip(doc);
    expect(pageLang(doc)).toBe('en');
    expect(doc.title).toBe(TITLE_EN);
    expect(mismatches(doc, 'en')).toEqual([]);
  });

  it('restores the recorded Dutch markup exactly when switching back', () => {
    const { doc } = loadPage();
    const before = snapshot(doc);
    flip(doc);
    flip(doc);
    expect(pageLang(doc)).toBe('nl');
    expect(doc.title).toBe(TITLE_NL);
    expect(snapshot(doc)).toEqual(before);
    expect(mismatches(doc, 'nl')).toEqual([]);
  });

  it('keeps the phone, the email and the year unchanged in English', () => {
    const { doc } = loadPage();
    flip(doc);
    const text = norm(doc.body.textContent);
    expect(text).toContain(`© ${new Date().getFullYear()} NewCONet. All rights reserved.`);
    expect($$(doc, 'a[href^="tel:"]').every((a) => a.getAttribute('href') === TEL)).toBe(true);
  });

  it('leaves the meta description, the structured data and the noscript message in Dutch', () => {
    const { doc } = loadPage();
    const before = $$(doc, 'script[type="application/ld+json"]').map((s) => s.textContent);
    const noscript = norm($(form(doc), 'noscript').textContent);
    flip(doc);
    expect($(doc, 'meta[name="description"]').getAttribute('content')).toBe(META_DESCRIPTION);
    expect($$(doc, 'script[type="application/ld+json"]').map((s) => s.textContent)).toEqual(before);
    expect(norm($(form(doc), 'noscript').textContent)).toBe(noscript);
    expect(noscript).toContain('Dit formulier werkt alleen met JavaScript.');
  });

  it('labels the menu toggle in the new language, closed and open', () => {
    const { doc } = loadPage();
    flip(doc);
    expect(menuToggle(doc).getAttribute('aria-label')).toBe('Open menu');
    menuToggle(doc).click();
    expect(menuToggle(doc).getAttribute('aria-label')).toBe('Close menu');
    flip(doc);
    expect(menuToggle(doc).getAttribute('aria-label')).toBe('Menu sluiten');
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('true');
    menuToggle(doc).click();
    expect(menuToggle(doc).getAttribute('aria-label')).toBe('Menu openen');
  });

  it('keeps the form values, the open FAQ item, the open menu and the focus on the button', () => {
    const { doc } = loadPage();
    fillForm(doc);
    $$(doc, 'details.faq-item')[2].open = true;
    menuToggle(doc).click();
    langButton(doc).focus();
    flip(doc);
    expect($(doc, '#rol').value).toBe('eigenaar');
    expect(radio(doc, 'partner').checked).toBe(true);
    expect($(doc, '#gebouw').value).toBe('kantoor');
    expect($(doc, '#naam').value).toBe(FULL.naam);
    expect($(doc, '#bedrijf').value).toBe(FULL.bedrijf);
    expect($(doc, '#bericht').value).toBe(FULL.bericht);
    expect($$(doc, 'details.faq-item')[2].open).toBe(true);
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('true');
    expect(doc.activeElement).toBe(langButton(doc));
  });

  it('keeps the prefill links inside translated markup working', () => {
    const { doc } = loadPage();
    flip(doc);
    $(byKey(doc, 'faqIntro'), 'a').click();
    expect(radio(doc, 'vraag').checked).toBe(true);
  });
});

describe('which language opens', () => {
  it('opens English for ?lang=en without storing the choice', () => {
    const { doc, win } = loadPage({ search: '?lang=en' });
    expect(pageLang(doc)).toBe('en');
    expect(doc.title).toBe(TITLE_EN);
    expect(mismatches(doc, 'en')).toEqual([]);
    expect(win.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('lets ?lang=nl win over a stored English choice', () => {
    const { doc } = loadPage({ search: '?lang=nl', stored: 'en' });
    expect(pageLang(doc)).toBe('nl');
    expect(doc.title).toBe(TITLE_NL);
  });

  it('lets ?lang=en win over a stored Dutch choice', () => {
    const { doc } = loadPage({ search: '?lang=en', stored: 'nl' });
    expect(pageLang(doc)).toBe('en');
  });

  it('opens the stored English choice when there is no lang parameter', () => {
    const { doc } = loadPage({ stored: 'en' });
    expect(pageLang(doc)).toBe('en');
    expect(mismatches(doc, 'en')).toEqual([]);
  });

  it('opens Dutch for a stored nl choice', () => {
    expect(pageLang(loadPage({ stored: 'nl' }).doc)).toBe('nl');
  });

  it('stays Dutch when nothing is stored', () => {
    expect(pageLang(loadPage().doc)).toBe('nl');
  });

  it.each([
    ['an unknown lang parameter', { search: '?lang=fr' }],
    ['an unknown stored value', { stored: 'fr' }],
    ['an empty lang parameter', { search: '?lang=' }],
  ])('stays Dutch for %s', (_label, options) => {
    expect(pageLang(loadPage(options).doc)).toBe('nl');
  });

  it('ignores an unknown lang parameter and falls back to the stored choice', () => {
    expect(pageLang(loadPage({ search: '?lang=fr', stored: 'en' }).doc)).toBe('en');
  });

  it.each([
    ['en', 'nl'],
    ['nl', 'en'],
  ])('stores the choice under newconet-taal when a click switches %s to %s', (from, to) => {
    const { doc, win } = loadPage({ stored: from });
    flip(doc);
    expect(win.localStorage.getItem(STORAGE_KEY)).toBe(to);
  });

  it('stores the choice on a click after a shared ?lang=en link and then removes the parameter', () => {
    const { doc, win } = loadPage({ search: '?lang=en' });
    flip(doc);
    expect(pageLang(doc)).toBe('nl');
    expect(win.localStorage.getItem(STORAGE_KEY)).toBe('nl');
    expect(new URL(win.location.href).searchParams.has('lang')).toBe(false);
  });

  it('removes the lang parameter from the address on the first click', () => {
    const { doc, win } = loadPage({ search: '?lang=en' });
    expect(new URL(win.location.href).searchParams.get('lang')).toBe('en');
    flip(doc);
    expect(win.location.search).toBe('');
  });

  it.each(['methods-throw', 'getter-throws'])('stays Dutch and keeps the switch working when storage throws (%s)', (storage) => {
    const { doc } = loadPage({ storage });
    expect(pageLang(doc)).toBe('nl');
    flip(doc);
    expect(pageLang(doc)).toBe('en');
    expect(mismatches(doc, 'en')).toEqual([]);
    flip(doc);
    expect(pageLang(doc)).toBe('nl');
  });

  it('still honours ?lang=en when storage throws', () => {
    expect(pageLang(loadPage({ search: '?lang=en', storage: 'getter-throws' }).doc)).toBe('en');
  });
});

describe('the form after switching language', () => {
  it('renders the visible field errors and the status message again in English, keeping the error style', () => {
    const { doc } = loadPage();
    submit(doc);
    flip(doc);
    expect($(doc, '#rol-fout').textContent.trim()).toBe(MSG.en.rol);
    expect($(doc, '#onderwerp-fout').textContent.trim()).toBe(MSG.en.onderwerp);
    expect($(doc, '#naam-fout').textContent.trim()).toBe(MSG.en.naam);
    expect($(doc, '#bedrijf-fout').textContent.trim()).toBe(MSG.en.bedrijf);
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.en.emailLeeg);
    expect($(doc, '#bericht-fout').textContent.trim()).toBe(MSG.en.bericht);
    expect($(doc, '#telefoon-fout').hidden).toBe(true);
    expect(status(doc).textContent.trim()).toBe(STATUS.en.onvolledig);
    expect(status(doc).classList.contains('is-error')).toBe(true);
    expect(isInvalid($(doc, '#naam'))).toBe(true);
  });

  it('renders the errors in Dutch again when switching back', () => {
    const { doc } = loadPage();
    submit(doc);
    flip(doc);
    flip(doc);
    expect($(doc, '#naam-fout').textContent.trim()).toBe(MSG.nl.naam);
    expect(status(doc).textContent.trim()).toBe(STATUS.nl.onvolledig);
  });

  it('picks the email message that matches the error showing when the language changes', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, email: 'naam@bedrijf' });
    submit(doc);
    flip(doc);
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.en.emailFout);
  });

  it('shows the outage status in English after switching', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    flip(doc);
    expect(status(doc).textContent.trim()).toBe(STATUS.en.storing);
  });

  it('shows the resident status in English after switching', () => {
    const { doc } = loadPage();
    type(doc, '#rol', 'bewoner');
    flip(doc);
    expect(status(doc).textContent.trim()).toBe(STATUS.en.bewoner);
  });

  it('shows the opening status in English after switching but leaves the built email alone', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    const href = $(doc, '#mailto-opnieuw').getAttribute('href');
    const copy = $(doc, '#bericht-kopie').value;
    flip(doc);
    expect(status(doc).textContent.trim()).toBe(STATUS.en.geopend);
    expect($(doc, '#mailto-opnieuw').getAttribute('href')).toBe(href);
    expect($(doc, '#bericht-kopie').value).toBe(copy);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('builds the next submit in English after switching', () => {
    const { doc, navigate } = loadPage();
    flip(doc);
    fillForm(doc);
    submit(doc);
    const { subject, body } = decode(navigate.mock.calls[0][0]);
    expect(subject).toBe('Introduction or quote via the website: Multi-tenant office building');
    expect(body).toBe(FULL_BODY.en);
    expect(status(doc).textContent.trim()).toBe(STATUS.en.geopend);
  });

  it('builds the next submit in Dutch after switching back', () => {
    const { doc, navigate } = loadPage();
    flip(doc);
    flip(doc);
    fillForm(doc);
    submit(doc);
    expect(decode(navigate.mock.calls[0][0]).body).toBe(FULL_BODY.nl);
  });

  it('builds the submit in English when the page opens in English', () => {
    const { doc, navigate } = loadPage({ search: '?lang=en' });
    fillForm(doc);
    submit(doc);
    expect(decode(navigate.mock.calls[0][0]).subject).toBe('Introduction or quote via the website: Multi-tenant office building');
  });

  it('reports the copy result in English', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { doc } = loadPage({ clipboard, search: '?lang=en' });
    fillForm(doc);
    submit(doc);
    $(doc, '#kopieer-bericht').click();
    await vi.waitFor(() => expect(status(doc).textContent.trim()).toBe(STATUS.en.gekopieerd));
  });

  it('reports a refused copy in English with the error style', async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };
    const { doc } = loadPage({ clipboard, search: '?lang=en' });
    fillForm(doc);
    submit(doc);
    $(doc, '#kopieer-bericht').click();
    await vi.waitFor(() => expect(status(doc).textContent.trim()).toBe(STATUS.en.kopieerFout));
    expect(status(doc).classList.contains('is-error')).toBe(true);
  });

  it('validates in English after the page opens in English', () => {
    const { doc } = loadPage({ search: '?lang=en' });
    submit(doc);
    expect($(doc, '#naam-fout').textContent.trim()).toBe(MSG.en.naam);
    expect(status(doc).textContent.trim()).toBe(STATUS.en.onvolledig);
  });
});

// ---------------------------------------------------------------- the contact form

describe('contact form markup', () => {
  it('is a novalidate form named by its heading', () => {
    const { doc } = loadPage();
    const f = form(doc);
    expect(f.classList.contains('contact-form')).toBe(true);
    expect(f.hasAttribute('novalidate')).toBe(true);
    expect(f.getAttribute('tabindex')).toBe('-1');
    expect(f.getAttribute('aria-labelledby')).toBe('formulier-titel');
    expect($(doc, '#formulier-titel').textContent.trim()).toBe('Stuur ons een bericht');
  });

  it('follows the spec order of parts inside the form', () => {
    const { doc } = loadPage();
    const ids = ['#rol', '#bewoner-melding', '#formulier-rest', '#onderwerp-groep', '#storing-melding', '#gebouw', '#naam', '#bedrijf', '#email', '#telefoon', '#bericht'];
    const parts = [...ids.map((id) => $(doc, id)), submitButton(doc), $(doc, '#formulier-bevestiging')];
    parts.forEach((part, i) => expect(part, `part ${i}`).not.toBeNull());
    for (let i = 1; i < parts.length; i += 1) {
      const follows = parts[i - 1].compareDocumentPosition(parts[i]) & 4;
      const contains = parts[i - 1].compareDocumentPosition(parts[i]) & 16;
      expect(follows || contains, `part ${i}`).toBeTruthy();
    }
  });

  it('keeps parts 4 to 13 inside #formulier-rest and the role, resident notice and status outside it', () => {
    const { doc } = loadPage();
    const rest = $(doc, '#formulier-rest');
    for (const id of ['onderwerp-groep', 'storing-melding', 'gebouw', 'naam', 'bedrijf', 'email', 'telefoon', 'bericht', 'formulier-bevestiging']) {
      expect(rest.contains($(doc, `#${id}`)), id).toBe(true);
    }
    expect(rest.contains(submitButton(doc))).toBe(true);
    for (const id of ['rol', 'bewoner-melding', 'formulier-status']) expect(rest.contains($(doc, `#${id}`)), id).toBe(false);
  });

  it('puts the status region in the DOM from load as a quiet role=status', () => {
    const { doc } = loadPage();
    expect(status(doc).getAttribute('role')).toBe('status');
    expect(status(doc).classList.contains('form-status')).toBe(true);
    expect(status(doc).textContent.trim()).toBe('');
    expect(status(doc).classList.contains('is-error')).toBe(false);
  });

  it('starts with the resident notice, the outage notice and the confirmation hidden and the rest shown', () => {
    const { doc } = loadPage();
    expect($(doc, '#bewoner-melding').hidden).toBe(true);
    expect($(doc, '#storing-melding').hidden).toBe(true);
    expect($(doc, '#formulier-bevestiging').hidden).toBe(true);
    expect($(doc, '#formulier-rest').hidden).toBe(false);
  });

  it('offers the role select with an empty first option and the four roles', () => {
    const { doc } = loadPage();
    const select = $(doc, 'select#rol');
    expect(select.getAttribute('name')).toBe('rol');
    expect([...select.options].map((o) => [o.value, o.textContent.trim()])).toEqual([
      ['', 'Kies uw rol'],
      ['eigenaar', ROLLEN.nl.eigenaar],
      ['beheerder', ROLLEN.nl.beheerder],
      ['vve', ROLLEN.nl.vve],
      ['bewoner', ROLLEN.nl.bewoner],
    ]);
    expect(select.value).toBe('');
    expect(select.getAttribute('aria-describedby')).toBe('rol-fout');
  });

  it('offers the building select with "Nog niet bekend" first and replaces the service select', () => {
    const { doc } = loadPage();
    const select = $(doc, 'select#gebouw');
    expect(select.getAttribute('name')).toBe('gebouw');
    expect([...select.options].map((o) => [o.value, o.textContent.trim()])).toEqual([
      ['', 'Nog niet bekend'],
      ['kantoor', GEBOUWEN.nl.kantoor],
      ['appartement', GEBOUWEN.nl.appartement],
      ['businesscenter', GEBOUWEN.nl.businesscenter],
      ['anders', GEBOUWEN.nl.anders],
    ]);
    expect(select.value).toBe('');
  });

  it('offers three request types and checks none of them by default', () => {
    const { doc } = loadPage();
    const radios = $$(doc, 'input[name="onderwerp"]');
    expect(radios.map((r) => [r.value, controlName(r)])).toEqual([
      ['partner', 'Kennismaking of offerte voor mijn gebouw'],
      ['storing', 'Storing of ondersteuning'],
      ['vraag', 'Algemene vraag'],
    ]);
    expect(radios.some((r) => r.checked)).toBe(false);
    expect($(doc, 'fieldset.keuze-groep#onderwerp-groep legend').textContent.trim()).toBe('Waarmee kunnen wij u helpen?');
    expect($(doc, 'fieldset#onderwerp-groep').getAttribute('aria-describedby')).toBe('onderwerp-fout');
    expect($$(doc, 'fieldset#onderwerp-groep label.keuze-optie')).toHaveLength(3);
  });

  it('types and labels the text fields with the right autocomplete tokens', () => {
    const { doc } = loadPage();
    expect($(doc, '#naam').getAttribute('type')).toBe('text');
    expect($(doc, '#naam').getAttribute('autocomplete')).toBe('name');
    expect($(doc, '#bedrijf').getAttribute('name')).toBe('bedrijf');
    expect($(doc, '#bedrijf').getAttribute('type')).toBe('text');
    expect($(doc, '#bedrijf').getAttribute('autocomplete')).toBe('organization');
    expect($(doc, '#email').getAttribute('type')).toBe('email');
    expect($(doc, '#email').getAttribute('autocomplete')).toBe('email');
    expect($(doc, '#telefoon').getAttribute('type')).toBe('tel');
    expect($(doc, '#telefoon').getAttribute('autocomplete')).toBe('tel');
  });

  it('caps the message at 1500 characters in five rows', () => {
    const { doc } = loadPage();
    expect($(doc, 'textarea#bericht').getAttribute('maxlength')).toBe('1500');
    expect($(doc, 'textarea#bericht').getAttribute('rows')).toBe('5');
  });

  it('links every field to its empty hidden error element through aria-describedby', () => {
    const { doc } = loadPage();
    for (const field of FIELD_ORDER) {
      const error = $(doc, `p.field-error#${field}-fout`);
      expect(error, `${field}-fout`).not.toBeNull();
      expect(error.hidden).toBe(true);
      expect(error.textContent.trim()).toBe('');
    }
    for (const field of ['rol', 'naam', 'bedrijf', 'email']) {
      expect($(doc, `#${field}`).getAttribute('aria-describedby')).toBe(`${field}-fout`);
    }
    expect($(doc, '#telefoon').getAttribute('aria-describedby')).toBe('telefoon-hint telefoon-fout');
    expect($(doc, '#bericht').getAttribute('aria-describedby')).toBe('bericht-hint bericht-fout');
    expect($(doc, 'p.field-hint#telefoon-hint').textContent.trim()).toBe('Handig als wij u willen terugbellen.');
    expect($(doc, 'p.field-hint#bericht-hint').textContent.trim()).toBe('Maximaal 1500 tekens.');
  });

  it('names every control, with the optional marker inside the label of the optional fields', () => {
    const { doc } = loadPage();
    for (const control of $$(form(doc), 'input, select, textarea, button')) {
      expect(controlName(control), `${control.tagName} #${control.id}`).not.toBe('');
    }
    expect(controlName($(doc, '#rol'))).toBe('Wie bent u?');
    expect(squash(controlName($(doc, '#gebouw')))).toBe(squash('Om welk type gebouw gaat het? (optioneel)'));
    expect(controlName($(doc, '#naam'))).toBe('Naam');
    expect(controlName($(doc, '#bedrijf'))).toBe('Naam van uw organisatie of VvE');
    expect(controlName($(doc, '#email'))).toBe('E-mailadres');
    expect(squash(controlName($(doc, '#telefoon')))).toBe(squash('Telefoonnummer (optioneel)'));
    expect(controlName($(doc, '#bericht'))).toBe('Bericht');
    expect(controlName($(doc, '#bericht-kopie'))).toBe('Uw bericht');
    expect(controlName($(doc, '#kopieer-bericht'))).toBe('Kopieer bericht');
    expect(controlName(submitButton(doc))).toBe('Open dit bericht in uw e-mailprogramma');
  });

  it('marks the submit button as the primary submit button inside #formulier-rest', () => {
    const { doc } = loadPage();
    expect(submitButton(doc).classList.contains('btn-primary')).toBe(true);
    expect($(doc, '#formulier-rest').contains(submitButton(doc))).toBe(true);
  });

  it('explains before submitting that the visitor sends the email', () => {
    const { doc } = loadPage();
    expect(norm($(form(doc), 'p.form-intro').textContent)).toBe(
      'Vul het formulier in. Daarna opent uw e-mailprogramma een e-mail aan info@newconet.nl met uw bericht. Die e-mail verstuurt u zelf.',
    );
  });

  it('shows the no-JavaScript fallback in a noscript paragraph inside the form', () => {
    const { doc } = loadPage();
    expect(form(doc).innerHTML).toContain('<noscript>');
    expect(norm($(form(doc), 'noscript').textContent)).toContain(
      'Dit formulier werkt alleen met JavaScript. Mail ons op info@newconet.nl, of bel ons op werkdagen tussen 08:30 en 17:30 op +31 (0)6 21 10 55 02.',
    );
  });

  it('builds the confirmation panel from the heading, the texts, the read-only copy and the actions', () => {
    const { doc } = loadPage();
    const panel = $(doc, 'div.form-bevestiging#formulier-bevestiging');
    expect($(panel, 'h4#bevestiging-titel').getAttribute('tabindex')).toBe('-1');
    expect($(panel, 'textarea#bericht-kopie').readOnly).toBe(true);
    expect($(panel, 'textarea#bericht-kopie').getAttribute('rows')).toBe('8');
    expect($(panel, 'div.bevestiging-acties button#kopieer-bericht.btn.btn-secondary')).not.toBeNull();
    expect($(panel, 'div.bevestiging-acties a#mailto-opnieuw')).not.toBeNull();
    expect($(panel, 'label.visually-hidden').getAttribute('for')).toBe('bericht-kopie');
  });
});

describe('residents and tenants', () => {
  it('shows the resident notice, hides the rest of the form and announces the status when bewoner is chosen', () => {
    const { doc } = loadPage();
    type(doc, '#rol', 'bewoner');
    expect($(doc, '#bewoner-melding').hidden).toBe(false);
    expect($(doc, '#formulier-rest').hidden).toBe(true);
    expect(status(doc).textContent.trim()).toBe(STATUS.nl.bewoner);
  });

  it('tells the resident to contact the owner, manager or VvE', () => {
    const { doc } = loadPage();
    type(doc, '#rol', 'bewoner');
    const text = norm($(doc, '#bewoner-melding').textContent);
    expect(text).toContain('Neem contact op met uw eigenaar, beheerder of VvE');
    expect(text).toContain('NewCONet maakt de afspraken over internet met de eigenaar, de beheerder of de VvE van een gebouw, niet met individuele bewoners of huurders.');
    expect($(doc, '#bewoner-melding p.storing-melding-kop')).not.toBeNull();
  });

  it('keeps the status region outside the hidden part so it can still announce', () => {
    const { doc } = loadPage();
    type(doc, '#rol', 'bewoner');
    expect($(doc, '#formulier-rest').contains(status(doc))).toBe(false);
    expect(status(doc).hidden).toBe(false);
  });

  it.each(['eigenaar', 'beheerder', 'vve'])('restores the form with its values when the role changes from bewoner to %s', (rol) => {
    const { doc } = loadPage();
    fillForm(doc);
    type(doc, '#rol', 'bewoner');
    type(doc, '#rol', rol);
    expect($(doc, '#bewoner-melding').hidden).toBe(true);
    expect($(doc, '#formulier-rest').hidden).toBe(false);
    expect($(doc, '#naam').value).toBe(FULL.naam);
    expect($(doc, '#bedrijf').value).toBe(FULL.bedrijf);
    expect($(doc, '#bericht').value).toBe(FULL.bericht);
    expect($(doc, '#gebouw').value).toBe('kantoor');
    expect(radio(doc, 'partner').checked).toBe(true);
  });

  it('clears the resident status when the role changes back', () => {
    const { doc } = loadPage();
    type(doc, '#rol', 'bewoner');
    type(doc, '#rol', 'eigenaar');
    expect(status(doc).textContent.trim()).toBe('');
  });

  it('does not submit anything for a resident, even when the submit event fires', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, rol: 'bewoner' });
    form(doc).dispatchEvent(new doc.defaultView.Event('submit', { bubbles: true, cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();
    expect($(doc, '#formulier-bevestiging').hidden).toBe(true);
    expect($(doc, '#rol-fout').textContent.trim()).toBe(MSG.nl.rolBewoner);
  });

  it('still prefills the radio and building type from a link while bewoner is chosen, leaving the role and visibility alone', () => {
    const { doc } = loadPage();
    type(doc, '#rol', 'bewoner');
    byKey(doc, 'routeKantoorKnop').click();
    expect(radio(doc, 'partner').checked).toBe(true);
    expect($(doc, '#gebouw').value).toBe('kantoor');
    expect($(doc, '#rol').value).toBe('bewoner');
    expect($(doc, '#bewoner-melding').hidden).toBe(false);
    expect($(doc, '#formulier-rest').hidden).toBe(true);
  });
});

describe('outage notice', () => {
  it('shows the notice with a call link when "Storing of ondersteuning" is checked', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    const notice = $(doc, '#storing-melding');
    expect(notice.hidden).toBe(false);
    const text = norm(notice.textContent);
    expect(text).toContain('Storing? Bel ons op werkdagen');
    expect(text).toContain('Voor klanten zijn wij bereikbaar van maandag tot en met vrijdag, van 08:30 tot 17:30.');
    expect(text).toContain('Woont u in een appartementencomplex? Meld een storing dan bij de eigenaar, de beheerder of de VvE van uw complex.');
    const call = link(notice, `Bel ${PHONE}`);
    expect(call.getAttribute('href')).toBe(TEL);
    expect(call.classList.contains('btn-alert')).toBe(true);
  });

  it('sits directly below the radio group', () => {
    const { doc } = loadPage();
    expect($(doc, 'fieldset#onderwerp-groep').nextElementSibling.id).toBe('storing-melding');
  });

  it.each(['partner', 'vraag'])('hides the notice and clears its status when "%s" is checked afterwards', (other) => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    radio(doc, other).click();
    expect($(doc, '#storing-melding').hidden).toBe(true);
    expect(status(doc).textContent.trim()).toBe('');
  });

  it('announces the outage sentence in the status region', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    expect(status(doc).textContent.trim()).toBe(STATUS.nl.storing);
  });

  it('keeps the rest of the form usable while the notice shows', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    expect($(doc, '#formulier-rest').hidden).toBe(false);
    expect(submitButton(doc).disabled).toBe(false);
  });
});

describe('prefilling from links', () => {
  const prefillLinks = LINKS.filter(([, href, onderwerp]) => href === '#contactformulier' && onderwerp);

  it.each(prefillLinks)('%s checks its request type and sets its building type', (key, _href, onderwerp, gebouw) => {
    const { doc } = loadPage();
    byKey(doc, key).click();
    expect(radio(doc, onderwerp).checked).toBe(true);
    if (typeof gebouw === 'string') expect($(doc, '#gebouw').value).toBe(gebouw);
    if (gebouw === null) expect($(doc, '#gebouw').value).toBe('');
  });

  it.each(prefillLinks.filter(([, , , gebouw]) => gebouw === null))('%s leaves a chosen building type unchanged', (key) => {
    const { doc } = loadPage();
    type(doc, '#gebouw', 'anders');
    byKey(doc, key).click();
    expect($(doc, '#gebouw').value).toBe('anders');
  });

  it('checks "Algemene vraag" from the FAQ intro link', () => {
    const { doc } = loadPage();
    $(byKey(doc, 'faqIntro'), 'a').click();
    expect(controlName(radio(doc, 'vraag'))).toBe('Algemene vraag');
    expect(radio(doc, 'vraag').checked).toBe(true);
    expect($(doc, '#gebouw').value).toBe('');
  });

  it('checks "Algemene vraag" from the support service link', () => {
    const { doc } = loadPage();
    byKey(doc, 'dienst5Link').click();
    expect(radio(doc, 'vraag').checked).toBe(true);
  });

  it('selects Businesscenter from the custom wifi link', () => {
    const { doc } = loadPage();
    byKey(doc, 'dienstMaatwerkLink').click();
    expect($(doc, '#gebouw').value).toBe('businesscenter');
  });

  it('does not prefill from the header contact button, which has no data-onderwerp', () => {
    const { doc } = loadPage();
    byKey(doc, 'headerCta').click();
    expect($$(doc, 'input[name="onderwerp"]').some((r) => r.checked)).toBe(false);
  });

  it('hides the outage notice again when a link switches the type away from storing', () => {
    const { doc } = loadPage();
    radio(doc, 'storing').click();
    byKey(doc, 'dienst5Link').click();
    expect($(doc, '#storing-melding').hidden).toBe(true);
  });

  it('shows the outage notice when a link prefills "storing"', () => {
    const { doc } = loadPage();
    const anchor = doc.createElement('a');
    anchor.setAttribute('href', '#contactformulier');
    anchor.dataset.onderwerp = 'storing';
    doc.body.append(anchor);
    anchor.click();
    expect(radio(doc, 'storing').checked).toBe(true);
    expect($(doc, '#storing-melding').hidden).toBe(false);
  });

  it('does not move focus into a field', () => {
    const { doc } = loadPage();
    byKey(doc, 'dienst1Link').click();
    expect(['INPUT', 'SELECT', 'TEXTAREA']).not.toContain(doc.activeElement.tagName);
  });

  it('re-validates the request type after a failed submit', () => {
    const { doc } = loadPage();
    submit(doc);
    expect($(doc, '#onderwerp-fout').hidden).toBe(false);
    byKey(doc, 'heroCta1').click();
    expect($(doc, '#onderwerp-fout').textContent.trim()).toBe('');
    expect(isInvalid($(doc, 'fieldset#onderwerp-groep'))).toBe(false);
  });
});

describe('validation on submit', () => {
  it('shows the six required-field messages for an empty form', () => {
    const { doc, navigate } = loadPage();
    submit(doc);
    expect($(doc, '#rol-fout').textContent.trim()).toBe(MSG.nl.rol);
    expect($(doc, '#onderwerp-fout').textContent.trim()).toBe(MSG.nl.onderwerp);
    expect($(doc, '#naam-fout').textContent.trim()).toBe(MSG.nl.naam);
    expect($(doc, '#bedrijf-fout').textContent.trim()).toBe(MSG.nl.bedrijf);
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.nl.emailLeeg);
    expect($(doc, '#bericht-fout').textContent.trim()).toBe(MSG.nl.bericht);
    expect($(doc, '#telefoon-fout').textContent.trim()).toBe('');
    for (const field of ['rol', 'onderwerp', 'naam', 'bedrijf', 'email', 'bericht']) {
      expect($(doc, `#${field}-fout`).hidden, field).toBe(false);
    }
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sets aria-invalid on the six invalid controls and the fieldset, not on the optional ones', () => {
    const { doc } = loadPage();
    submit(doc);
    for (const selector of ['#rol', 'fieldset#onderwerp-groep', '#naam', '#bedrijf', '#email', '#bericht']) {
      expect(isInvalid($(doc, selector)), selector).toBe(true);
    }
    expect(isInvalid($(doc, '#telefoon'))).toBe(false);
    expect(isInvalid($(doc, '#gebouw'))).toBe(false);
  });

  it('fills the status region with the incomplete-form message in the error style', () => {
    const { doc } = loadPage();
    submit(doc);
    expect(status(doc).textContent.trim()).toBe(STATUS.nl.onvolledig);
    expect(status(doc).classList.contains('is-error')).toBe(true);
  });

  it('focuses the role select first', () => {
    const { doc } = loadPage();
    submit(doc);
    expect(doc.activeElement).toBe($(doc, '#rol'));
  });

  it.each([
    ['the first radio once the role is chosen', { rol: 'eigenaar' }, 'input[name="onderwerp"][value="partner"]'],
    ['the name once role and request type are chosen', { rol: 'eigenaar', onderwerp: 'vraag' }, '#naam'],
    ['the organisation once the name is filled in', { rol: 'eigenaar', onderwerp: 'vraag', naam: 'Jan' }, '#bedrijf'],
    ['the email once the organisation is filled in', { rol: 'eigenaar', onderwerp: 'vraag', naam: 'Jan', bedrijf: 'BV' }, '#email'],
    ['the phone when it is the first invalid field', { ...FULL, telefoon: '12ab', bericht: '' }, '#telefoon'],
    ['the message when it is the only invalid field', { ...FULL, bericht: '' }, '#bericht'],
  ])('focuses %s', (_label, fields, selector) => {
    const { doc } = loadPage();
    if (fields.rol) type(doc, '#rol', fields.rol);
    if (fields.onderwerp) radio(doc, fields.onderwerp).click();
    for (const field of ['naam', 'bedrijf', 'email', 'telefoon', 'bericht']) if (fields[field]) type(doc, `#${field}`, fields[field]);
    submit(doc);
    expect(doc.activeElement).toBe($(doc, selector));
  });

  it('shows no confirmation and no mailto after a failed submit', () => {
    const { doc, navigate } = loadPage();
    submit(doc);
    expect($(doc, '#formulier-bevestiging').hidden).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('hides a confirmation again when a later submit is invalid', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    expect($(doc, '#formulier-bevestiging').hidden).toBe(false);
    type(doc, '#naam', '');
    submit(doc);
    expect($(doc, '#formulier-bevestiging').hidden).toBe(true);
  });

  it('shows the invalid-address message for naam@bedrijf', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, email: 'naam@bedrijf' });
    submit(doc);
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.nl.emailFout);
    expect(isInvalid($(doc, '#email'))).toBe(true);
    expect(doc.activeElement).toBe($(doc, '#email'));
  });

  it('shows the phone message for 12ab', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, telefoon: '12ab' });
    submit(doc);
    expect($(doc, '#telefoon-fout').textContent.trim()).toBe(MSG.nl.telefoon);
    expect(isInvalid($(doc, '#telefoon'))).toBe(true);
  });

  it.each([
    ['naam', '#naam', 'naam'],
    ['bedrijf', '#bedrijf', 'bedrijf'],
    ['bericht', '#bericht', 'bericht'],
  ])('counts whitespace-only %s as empty', (field, selector) => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    type(doc, selector, '   ');
    submit(doc);
    expect($(doc, `#${field}-fout`).textContent.trim()).toBe(MSG.nl[field]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not validate before the first submit', () => {
    const { doc } = loadPage();
    type(doc, '#email', 'naam@bedrijf');
    type(doc, '#naam', '');
    expect($(doc, '#email-fout').textContent.trim()).toBe('');
    expect(isInvalid($(doc, '#email'))).toBe(false);
    expect($(doc, '#naam-fout').textContent.trim()).toBe('');
  });
});

describe('re-validation after a failed submit', () => {
  it.each([
    ['naam', '#naam', 'Jan'],
    ['bedrijf', '#bedrijf', 'Voorbeeld BV'],
    ['email', '#email', 'jan@voorbeeld.nl'],
    ['bericht', '#bericht', 'Een vraag'],
    ['rol', '#rol', 'eigenaar'],
  ])('clears the %s message and aria-invalid as soon as the field is fixed', (field, selector, value) => {
    const { doc, navigate } = loadPage();
    submit(doc);
    expect(isInvalid($(doc, selector))).toBe(true);
    type(doc, selector, value);
    expect($(doc, `#${field}-fout`).textContent.trim()).toBe('');
    expect($(doc, `#${field}-fout`).hidden).toBe(true);
    expect(isInvalid($(doc, selector))).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clears the request-type error when a radio is chosen', () => {
    const { doc } = loadPage();
    submit(doc);
    radio(doc, 'vraag').click();
    expect($(doc, '#onderwerp-fout').textContent.trim()).toBe('');
    expect(isInvalid($(doc, 'fieldset#onderwerp-groep'))).toBe(false);
  });

  it('shows a new message when the visitor types an invalid value after a failed submit', () => {
    const { doc } = loadPage();
    submit(doc);
    type(doc, '#email', 'naam@bedrijf');
    expect($(doc, '#email-fout').textContent.trim()).toBe(MSG.nl.emailFout);
    expect(isInvalid($(doc, '#email'))).toBe(true);
  });

  it('leaves the other invalid fields marked while one is fixed', () => {
    const { doc } = loadPage();
    submit(doc);
    type(doc, '#naam', 'Jan');
    expect(isInvalid($(doc, '#email'))).toBe(true);
    expect($(doc, '#bericht-fout').textContent.trim()).toBe(MSG.nl.bericht);
  });

  it('clears the incomplete-form status once every field is valid again', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, bericht: '' });
    submit(doc);
    expect(status(doc).textContent.trim()).toBe(STATUS.nl.onvolledig);
    type(doc, '#bericht', 'Een vraag');
    expect(status(doc).textContent.trim()).toBe('');
  });
});

describe('valid submit', () => {
  it('navigates once to a mailto for info@newconet.nl and prevents the native submit', () => {
    const { doc, win, navigate } = loadPage();
    fillForm(doc);
    let prevented = false;
    form(doc).addEventListener('submit', (event) => {
      prevented = event.defaultPrevented;
    });
    submit(doc);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0].startsWith(`${MAIL}?subject=`)).toBe(true);
    expect(prevented).toBe(true);
    expect(win.location.href).not.toContain('mailto');
  });

  it('navigates to the href buildMailto returns for the entered values', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    expect(navigate.mock.calls[0][0]).toBe(buildMailto(FULL).href);
  });

  it('decodes to the spec subject and CRLF-joined body for the full example', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    const { subject, body } = decode(navigate.mock.calls[0][0]);
    expect(subject).toBe('Kennismaking of offerte via de website: Multi-tenant kantoorgebouw');
    expect(body).toBe(FULL_BODY.nl);
  });

  it('leaves out the empty building type and phone lines', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, onderwerp: 'vraag', gebouw: '', telefoon: '' });
    submit(doc);
    const { subject, body } = decode(navigate.mock.calls[0][0]);
    expect(subject).toBe('Vraag via de website');
    expect(body).toBe(
      [
        'Rol: Eigenaar van het gebouw',
        'Onderwerp: Algemene vraag',
        'Naam: Jan de Vries',
        'Organisatie: Voorbeeld Vastgoed BV',
        'E-mailadres: jan@voorbeeld.nl',
        '',
        'Bericht:',
        FULL.bericht,
      ].join('\r\n'),
    );
  });

  it('uses the outage subject for a storing message', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, onderwerp: 'storing', gebouw: '' });
    submit(doc);
    expect(decode(navigate.mock.calls[0][0]).subject).toBe('Storing of ondersteuning via de website');
  });

  it('trims the entered values before building the body', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, naam: '  Jan de Vries  ' });
    submit(doc);
    expect(decode(navigate.mock.calls[0][0]).body).toContain('Naam: Jan de Vries\r\n');
  });

  it('shows the confirmation panel and moves focus to its heading', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    const panel = $(doc, '#formulier-bevestiging');
    expect(panel.hidden).toBe(false);
    const heading = $(panel, 'h4#bevestiging-titel');
    expect(heading.textContent.trim()).toBe('Nog één stap: verstuur de e-mail');
    expect(doc.activeElement).toBe(heading);
  });

  it('explains the next step and offers the address and number as links', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    const panel = $(doc, '#formulier-bevestiging');
    const text = norm(panel.textContent);
    expect(text).toContain('Uw e-mailprogramma opent een nieuwe e-mail aan info@newconet.nl met uw bericht erin. Pas als u die e-mail verstuurt, ontvangen wij uw bericht.');
    expect(text).toContain('Is er geen e-mail geopend? Kopieer dan uw bericht en mail het naar');
    expect($$(panel, `a[href="${TEL}"]`).length).toBeGreaterThanOrEqual(1);
    expect($$(panel, `a[href="${MAIL}"]`).length).toBeGreaterThanOrEqual(1);
  });

  it('announces that the email app opens, without an error style', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    expect(status(doc).textContent.trim()).toBe(STATUS.nl.geopend);
    expect(status(doc).classList.contains('is-error')).toBe(false);
  });

  it('keeps every entered value', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    expect($(doc, '#rol').value).toBe(FULL.rol);
    expect($(doc, '#gebouw').value).toBe(FULL.gebouw);
    expect($(doc, '#naam').value).toBe(FULL.naam);
    expect($(doc, '#bedrijf').value).toBe(FULL.bedrijf);
    expect($(doc, '#email').value).toBe(FULL.email);
    expect($(doc, '#telefoon').value).toBe(FULL.telefoon);
    expect($(doc, '#bericht').value).toBe(FULL.bericht);
    expect(radio(doc, 'partner').checked).toBe(true);
  });

  it('fills the read-only copy textarea with the exact email body', () => {
    const { doc } = loadPage();
    fillForm(doc);
    submit(doc);
    const copy = $(doc, 'textarea#bericht-kopie');
    expect(copy.readOnly).toBe(true);
    // A textarea's value API normalises CRLF to LF.
    expect(copy.value).toBe(FULL_BODY.nl.replace(/\r\n/g, '\n'));
  });

  it('points "Open de e-mail opnieuw" at the same mailto URL', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    const again = $(doc, 'a#mailto-opnieuw');
    expect(nameOf(again)).toBe('Open de e-mail opnieuw');
    expect(again.getAttribute('href')).toBe(navigate.mock.calls[0][0]);
  });

  it('rebuilds the link, the copy and the navigation on a second submit', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc);
    submit(doc);
    type(doc, '#naam', 'Piet Jansen');
    submit(doc);
    expect(navigate).toHaveBeenCalledTimes(2);
    const second = navigate.mock.calls[1][0];
    expect(decode(second).body).toContain('Naam: Piet Jansen');
    expect($(doc, '#mailto-opnieuw').getAttribute('href')).toBe(second);
    expect($(doc, '#bericht-kopie').value).toContain('Naam: Piet Jansen');
  });

  it('does not navigate on page load', () => {
    expect(loadPage().navigate).not.toHaveBeenCalled();
  });
});

describe('markup in submitted values', () => {
  const payload = '<script>alert(1)</script><img src=x onerror="alert(2)">';

  it('creates no element from a script or img value and shows it as text in the copy textarea', () => {
    const { doc, navigate } = loadPage();
    fillForm(doc, { ...FULL, bericht: payload });
    const before = doc.querySelectorAll('*').length;
    submit(doc);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(doc.querySelectorAll('*').length).toBe(before);
    expect($$(doc, 'img[onerror], img[src="x"]')).toHaveLength(0);
    expect($$(doc, 'script').some((sc) => sc.textContent.includes('alert'))).toBe(false);
    expect($(doc, '#bericht-kopie').value).toContain(payload);
  });

  it('shows a hostile organisation as text everywhere it appears after submit', () => {
    const { doc } = loadPage();
    fillForm(doc, { ...FULL, bedrijf: payload });
    submit(doc);
    expect($$(doc, 'img[onerror]')).toHaveLength(0);
    expect($(doc, '#bericht-kopie').value).toContain(`Organisatie: ${payload}`);
  });
});

describe('copying the message', () => {
  const submitValid = (page) => {
    fillForm(page.doc);
    submit(page.doc);
    return $(page.doc, '#kopieer-bericht');
  };

  it('writes the body to the clipboard and reports success', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const page = loadPage({ clipboard });
    submitValid(page).click();
    await vi.waitFor(() => expect(status(page.doc).textContent.trim()).toBe(STATUS.nl.gekopieerd));
    expect(clipboard.writeText).toHaveBeenCalledWith(FULL_BODY.nl);
    expect(status(page.doc).classList.contains('is-error')).toBe(false);
  });

  it('selects the textarea text and reports the failure when the clipboard refuses', async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };
    const page = loadPage({ clipboard });
    submitValid(page).click();
    await vi.waitFor(() => expect(status(page.doc).textContent.trim()).toBe(STATUS.nl.kopieerFout));
    expect(status(page.doc).classList.contains('is-error')).toBe(true);
    const copy = $(page.doc, '#bericht-kopie');
    expect(copy.selectionStart).toBe(0);
    expect(copy.selectionEnd).toBe(copy.value.length);
  });

  it('reports the failure when the browser offers no clipboard', async () => {
    const page = loadPage();
    submitValid(page).click();
    await vi.waitFor(() => expect(status(page.doc).textContent.trim()).toBe(STATUS.nl.kopieerFout));
    expect(status(page.doc).classList.contains('is-error')).toBe(true);
  });
});

describe('mobile menu', () => {
  const escape = (doc, target) => target.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  it('starts closed with the "Menu openen" label', () => {
    const { doc } = loadPage();
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(nameOf(menuToggle(doc))).toBe('Menu openen');
  });

  it('opens on activation, updates state and label, and focuses "Diensten"', () => {
    const { doc } = loadPage();
    menuToggle(doc).click();
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('true');
    expect(nameOf(menuToggle(doc))).toBe('Menu sluiten');
    expect(doc.activeElement).toBe(link($(doc, 'nav#hoofdmenu'), 'Diensten'));
  });

  it('closes on a second activation and leaves focus on the toggle', () => {
    const { doc } = loadPage();
    menuToggle(doc).click();
    menuToggle(doc).click();
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(nameOf(menuToggle(doc))).toBe('Menu openen');
    expect(doc.activeElement).toBe(menuToggle(doc));
  });

  it('closes on Escape and returns focus to the toggle', () => {
    const { doc } = loadPage();
    menuToggle(doc).click();
    escape(doc, doc.activeElement);
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(doc.activeElement).toBe(menuToggle(doc));
  });

  it('leaves focus alone when Escape is pressed with the menu closed', () => {
    const { doc } = loadPage();
    const field = $(doc, '#naam');
    field.focus();
    escape(doc, field);
    expect(doc.activeElement).toBe(field);
  });

  it('closes when a menu link is followed', () => {
    const { doc } = loadPage();
    menuToggle(doc).click();
    link($(doc, 'nav#hoofdmenu'), 'Werkwijze').click();
    expect(menuToggle(doc).getAttribute('aria-expanded')).toBe('false');
    expect(nameOf(menuToggle(doc))).toBe('Menu openen');
  });
});

describe('honesty about sending', () => {
  const claimsSent = /bedankt|verzonden|is verstuurd|succesvol|hebben uw bericht ontvangen/i;

  it('never shows a thank-you or sent message on load', () => {
    const { doc } = loadPage();
    expect(doc.body.textContent).not.toMatch(claimsSent);
  });

  it('never shows a thank-you or sent message after a valid submit or a copy', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const { doc } = loadPage({ clipboard });
    fillForm(doc);
    submit(doc);
    $(doc, '#kopieer-bericht').click();
    await vi.waitFor(() => expect(status(doc).textContent.trim()).toBe(STATUS.nl.gekopieerd));
    expect(doc.body.textContent).not.toMatch(claimsSent);
  });
});

// ---------------------------------------------------------------- structured data

describe('structured data', () => {
  const blocks = (doc) => $$(doc, 'head script[type="application/ld+json"]');
  const parsed = (doc) => blocks(doc).map((script) => JSON.parse(script.textContent));

  const ORGANIZATION = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NewCONet',
    url: 'https://newconet.apps.mitstack.dev/',
    email: 'info@newconet.nl',
    telephone: '+31621105502',
    description:
      'NewCONet levert internet en wifi in multi-tenant kantoorgebouwen en complete appartementencomplexen, en internet voor gebouwgebonden systemen. NewCONet werkt voor eigenaren, beheerders en VvE’s, niet voor particulieren.',
    audience: {
      '@type': 'BusinessAudience',
      name: 'Eigenaren, beheerders en VvE’s van kantoorgebouwen en appartementencomplexen',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: '+31621105502',
      email: 'info@newconet.nl',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:30',
        closes: '17:30',
      },
    },
  };

  it('carries exactly two JSON-LD blocks in the head and both parse', () => {
    const { doc } = loadPage();
    expect(blocks(doc)).toHaveLength(2);
    expect(() => parsed(doc)).not.toThrow();
  });

  it('puts the FAQPage first and the Organization second', () => {
    const { doc } = loadPage();
    expect(parsed(doc).map((block) => block['@type'])).toEqual(['FAQPage', 'Organization']);
    expect(parsed(doc)[0]['@context']).toBe('https://schema.org');
    expect(parsed(doc)[0].inLanguage).toBe('nl');
  });

  it('has as many FAQ questions as the page shows, fourteen', () => {
    const { doc } = loadPage();
    expect(parsed(doc)[0].mainEntity).toHaveLength(14);
    expect(parsed(doc)[0].mainEntity).toHaveLength($$(doc, 'details.faq-item').length);
  });

  it('gives every question and answer the visible Dutch summary and answer text, in page order', () => {
    const { doc } = loadPage();
    const entities = parsed(doc)[0].mainEntity;
    const items = $$(doc, 'details.faq-item');
    items.forEach((item, i) => {
      expect(entities[i]['@type'], `question ${i}`).toBe('Question');
      expect(norm(entities[i].name), `name ${i}`).toBe(norm($(item, 'summary').textContent));
      expect(entities[i].acceptedAnswer['@type'], `answer ${i}`).toBe('Answer');
      expect(norm(entities[i].acceptedAnswer.text), `text ${i}`).toBe(norm($(item, ':scope > p').textContent));
    });
  });

  it('keeps the FAQ structured data equal to the spec Dutch FAQ copy', () => {
    const { doc } = loadPage();
    const dutch = Object.fromEntries(COPY.map((row) => [row[0], row[3]]));
    const keys = COPY.map((row) => row[0]).filter((key) => /^faq\d+V$/.test(key));
    const entities = parsed(doc)[0].mainEntity;
    expect(entities.map((e) => e.name)).toEqual(keys.map((key) => dutch[key]));
    expect(entities.map((e) => e.acceptedAnswer.text)).toEqual(keys.map((key) => dutch[key.replace('V', 'A')]));
  });

  it('describes the Organization exactly as the spec does', () => {
    const { doc } = loadPage();
    expect(parsed(doc)[1]).toEqual(ORGANIZATION);
  });

  it('carries the phone, the email and the office hours on the Organization', () => {
    const { doc } = loadPage();
    const organization = parsed(doc)[1];
    expect(organization.telephone).toBe('+31621105502');
    expect(organization.email).toBe('info@newconet.nl');
    expect(organization.contactPoint.hoursAvailable).toMatchObject({ opens: '08:30', closes: '17:30' });
  });

  it.each(['areaServed', 'knowsLanguage', 'availableLanguage'])('claims no %s in either block', (property) => {
    const { doc } = loadPage();
    expect(blocks(doc)).toHaveLength(2);
    expect(blocks(doc).map((script) => script.textContent).join('\n')).not.toContain(property);
  });
});
