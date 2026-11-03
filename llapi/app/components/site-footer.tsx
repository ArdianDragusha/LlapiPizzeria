import Link from "next/link";

// Replace these sample contact details with the pizzeria's real business information.
const contactDetails = {
  address: ["Street address", "Postal code and city"],
  phone: "+358 40 000 0000",
  email: "hello@example.com",
};

// Replace these sample days and times with the real weekly opening hours.
const openingHours = [
  { day: "Monday", hours: "10:30–22:00" },
  { day: "Tuesday", hours: "10:30–22:00" },
  { day: "Wednesday", hours: "10:30–22:00" },
  { day: "Thursday", hours: "10:30–22:00" },
  { day: "Friday", hours: "10:30–23:30" },
  { day: "Saturday", hours: "11:00–23:30" },
  { day: "Sunday", hours: "12:00–21:00" },
];

// Replace the sample delivery message, delivery areas, fees, and minimum orders.
const deliveryZones = [
  { distance: "0–3.0 km", fee: "€2.90", minimum: "€10.00" },
  { distance: "3.0–6.0 km", fee: "€4.90", minimum: "€12.00" },
  { distance: "6.0–10.0 km", fee: "€6.90", minimum: "€15.00" },
];

// Update this sample business ID and year if the legal footer details change.
const businessId = "0000000-0";
const copyrightYear = 2026;

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <section className="site-footer-contact" aria-labelledby="footer-contact-title">
          <h2 className="site-footer-brand" id="footer-contact-title">
            Pizzeria <span>Llapi</span>
          </h2>
          <address>
            {contactDetails.address.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <a href={`tel:${contactDetails.phone.replaceAll(" ", "")}`}>
              {contactDetails.phone}
            </a>
            <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>
          </address>
        </section>

        <section aria-labelledby="footer-hours-title">
          <h2 id="footer-hours-title">Opening hours</h2>
          <dl className="site-footer-hours">
            {openingHours.map(({ day, hours }) => (
              <div key={day}>
                <dt>{day}</dt>
                <dd>{hours}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="footer-delivery-title">
          <h2 id="footer-delivery-title">Delivery</h2>
          <p className="site-footer-delivery-note">
            We deliver within 10 km. Free delivery on orders over €20.
          </p>
          <dl className="site-footer-zones">
            {deliveryZones.map(({ distance, fee, minimum }) => (
              <div key={distance}>
                <dt>{distance}</dt>
                <dd>
                  {fee} · min {minimum}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="site-footer-bottom">
        <p>
          © {copyrightYear} Pizzeria Llapi · Y-tunnus {businessId}
        </p>
        <Link href="/kitchen">Staff: kitchen view</Link>
      </div>
    </footer>
  );
}
