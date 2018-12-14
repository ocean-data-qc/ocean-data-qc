function [T, SP] = teos2eos_chem(SA, CT, P, TA, DIC, NO3, SIOH4)
% teos2eos_chem:      Convert temperature and salinity from TEOS-10 to EOS-80
% 
% Description:
%      Convert conservative temperature to in-situ temperature and
%      Absolute Salinity (SA) to Practical Salinity (SP). Salinity
%      conversion depends on Total Alkalinity, Dissolved Inorganic Carbon
%      and Nitrate and Silicate concentrations.
% 
% Usage:
%      [T, SP] = teos2eos_chem(SA, CT, P, TA, DIC, NO3, SIOH4)
%      
% Input:
%       SA: Absolute Salinity in g/kg
%       CT: Conservative Temperature in degrees C
%        P: Sea water pressure in dbar
%       TA: Total Alkalinity, in µmol/kg
%      DIC: Dissolved Inorganic Carbone concentration in µmol/kg
%      NO3: Total Nitrate concentration in µmol/kg
%    SIOH4: Total Silicate concentration in µmol/kg
% 
% Details:
%      Conversion from Absolute (SA) to Practical Salinity (SP) depends
%      on carbon system parameters and ion concentration which most
%      affect water density anomalies.
% 
% Output:
%        T: in situ Temperature (deg C)
%       SP: Practical Salinity (psu)
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
%      eos2teos_chem does the reverse, teos2eos_geo, sa2sp_cham
%      package GSW for Matlab
% 
% Examples:
%         % Calculate insitu Temperature and practical salinity of a sample with 
%         % Absolute Salinity of 35 g/kg, Conservative Temperature of 18 deg C,
%         % at 0 dbar and Total Alkalinity of 0.00234 mol/kg and DIC of 0.00202 mol/kg, 
%         % zero Nitrate and Silicate
%         [T, SP] = teos2eos_chem(35, 18, 0, 0.00234, 0.00202, 0, 0)
%      

    % convert temperature
    T = gsw_t_from_CT (SA, CT, P);
    % convert salinity
    SP = sa2sp_chem (SA, TA, DIC, NO3, SIOH4);
end

