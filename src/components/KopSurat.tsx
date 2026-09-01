import React from "react";
import { VillageProfile } from "../types";
import { cleanKabupatenName, cleanKecamatanName, cleanDesaName } from "../lib/formatIndoText";
import { OFFICIAL_MAGETAN_LOGO } from "../lib/profile";

interface KopSuratProps {
  profile: VillageProfile;
}

export const KopSurat: React.FC<KopSuratProps> = ({ profile }) => {
  const kabClean = cleanKabupatenName(profile.namaKabupaten).toUpperCase();
  const kecClean = cleanKecamatanName(profile.namaKecamatan).toUpperCase();
  const desaClean = cleanDesaName(profile.namaDesa).toUpperCase();

  const kabText = `PEMERINTAH KABUPATEN ${kabClean}`;
  const kecText = `KECAMATAN ${kecClean}`;
  const desaText = `DESA ${desaClean}`;

  // Ensure document kop uses the uploaded village logo or official regional emblem, NEVER the app system icon
  let logoSrc = profile.logoUrl || OFFICIAL_MAGETAN_LOGO;
  if (logoSrc.includes("Screenshot_2026-08-10_074401")) {
    logoSrc = OFFICIAL_MAGETAN_LOGO;
  }
  const kodePos = profile.kodePos || "63362";

  return (
    <div className="w-full text-black mb-4" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="flex items-center gap-4">
        {/* Left Official Logo */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={logoSrc}
            alt="Lambang Daerah"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Center Kop Text */}
        <div className="flex-1 text-center pr-4">
          <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase leading-tight text-black">
            {kabText}
          </h2>
          <h3 className="text-sm sm:text-base font-bold tracking-wide uppercase leading-tight text-black mt-0.5">
            {kecText}
          </h3>
          <h1 className="text-xl sm:text-3xl font-black tracking-wider uppercase leading-none text-black mt-1">
            {desaText}
          </h1>
          
          <p className="text-xs sm:text-[13px] font-normal leading-snug text-black mt-1">
            {profile.alamatKantor || `Jl. Slamet Riyadi, Desa ${cleanDesaName(profile.namaDesa)}`} Kode Pos: {kodePos}
          </p>

          <div className="text-[11px] sm:text-xs text-black leading-snug flex flex-wrap items-center justify-center gap-x-2 mt-0.5">
            {profile.emailKantor ? (
              <span>e-mail : {profile.emailKantor}</span>
            ) : (
              <span>e-mail : pemdesponcol@gmail.com</span>
            )}
            <span>.</span>
            {profile.websiteDesa ? (
              <span>http://{profile.websiteDesa.replace(/^https?:\/\//, "")}</span>
            ) : (
              <span>http://poncol.magetan.go.id</span>
            )}
          </div>
        </div>
      </div>

      {/* Right-aligned Kode Pos text indicator right above the double line */}
      <div className="flex justify-end pr-1 mt-0.5">
        <span className="text-xs font-bold text-black">
          Kode Pos : {kodePos}
        </span>
      </div>

      {/* Double Border: Top Thick Line + Bottom Thin Line */}
      <div className="w-full mt-1">
        <div className="w-full h-[3px] bg-black"></div>
        <div className="w-full h-[1px] bg-black mt-[1.5px]"></div>
      </div>
    </div>
  );
};


