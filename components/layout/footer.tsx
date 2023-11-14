import Link from "next/link";

export default function Footer() {

  return (
    <div className="pagefooter">
      <div>Développement par Will421 et Bug38 - Design par GCQRA</div>
      <div className="mx-6"></div>
      <Link className="fade-text" href='https://github.com/Oozturn/oozturn' target="_blank" rel="noopener noreferrer">Projet Github</Link>
    </div>
  )
}