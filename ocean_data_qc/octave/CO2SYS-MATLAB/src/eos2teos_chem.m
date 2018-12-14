function [CT, SA] = eos2teos_chem(SP, T, P, TA, DIC, NO3, SIOH4)
% eos2teos_chem.Rd
% Convert temperature and salinity from EOS-80 to TEOS-10
% 
% Description:
%      Convert in-situ to Conservative temperature and Practical (SP) to
%      Absolute Salinity (SA) Salinity conversion depends on Total
%      Alkalinity, Dissolved Inorganic Carbon and Nitrate and Silicate
%      concentrations.
% 
% Usage:
%      [CT, SA] = eos2teos_chem(SP, T, P, TA, DIC, NO3, SIOH4)
%      
% Input:
%       SP: Practical Salinity on the practical salinity scale
%        T: in-situ temperature in deg. C
%        P: Sea water pressure in dbar
%       TA: Total Alkalinity, in µmol/kg
%      DIC: Dissolved Inorganic Carbone concentration in µmol/kg
%      NO3: Total Nitrate concentration in µmol/kg
%    SIOH4: Total Silicate concentration in µmol/kg
% 
% Details:
%      Conversion from Practical (SP) to Absolute Salinity (SA) depends
%      on carbon system parameters and ion concentration which most
%      affect water density anomalies.
% 
% Output:
%       CT: Conservative Temperature (deg C)
%       SA: Absolute Salinity (g/kg)
% 
% Author(s):
%      Jean-Marie Epitalon
% 
% References:
%      TEOS-10 web site: http://www.teos-10.org/
% 
%      What every oceanographer needs to know about TEOS-10 (The TEOS-10
%      Primer) by Rich Pawlowicz (on TEOS-10 web site)
% 
%      R. Pawlowicz, D. G. Wright, and F. J. Millero, 2011: The
%      effects of biogeochemical processes on oceanic conductivity/
%      salinity/density relationships and the characterization of real
%      seawater
% 
%      T. J. McDougall, D. R. Jackett, F. J. Millero, R. Pawlowicz, 
%      and P. M. Barker, 2012: Algorithm for estimating
%      Absolute Salinity
% 
% See Also:
%      teos2eos_chem does the reverse, eos2teos_geo, sp2sa_chem
%      package GSW for Matlab
% 
% Examples:
%         % Calculate Conservative Temperature and Absolute Salinity of a sample with 
%         % Practical Salinity of 35 psu, in-situ Temperature of 18 deg C,
%         % at 0 dbar and Total Alkalinity of 0.00234 mol/kg and DIC of 0.00202 mol/kg
%         % zero Nitrate and Silicate
%         [CT, SA] = eos2teos_chem(35, 18, 0, 0.00234, 0.00202, 0, 0)
%      

    % convert salinity
    SA = sp2sa_chem (SP, TA, DIC, NO3, SIOH4);
    % convert temperature
    CT = gsw_CT_from_t (SA, T, P);
end
