function SA = sp2sa_chem(SP, TA, DIC, NO3, SIOH4)
% sp2sa_chem :           From Practical to Absolute Salinity
% 
% Description:
%      Convert from Practical (SP) to Absolute Salinity (SA) based on
%      Total Alkalinity, Dissolved Inorganic Carbon and Nitrate and
%      Silicate concentrations.
% 
% Usage:
%      sp2sa_chem(SP, TA, DIC, NO3, SIOH4)
%      
% Input:
%       SP: Practical Salinity on the practical salinity scale
%       TA: Total Alkalinity, in µmol/kg
%      DIC: Dissolved Inorganic Carbone concentration in µmol/kg
%      NO3: Total Nitrate concentration in µmol/kg
%    SIOH4: Total Silicate concentration in µmol/kg
% 
% Details:
%      Convert from Practical (SP) to Absolute Salinity (SA) from carbon
%      system parameters and ion concentration which most affect water
%      density anomalies.
% 
% Output:
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
%      sa2sp_chem does the reverse
%      sp2sa_geo
% 
% Examples:
%         % Calculate the absolute salinity of a sample with practical Salinity of 35,
%         % Total Alkalinity of 0.00234 mol/kg and DIC of 0.00202 mol/kg
%         SA = sp2sa_chem(SP=35, TA=0.00234, DIC=0.00202)
%


    % This function is made of two parts :
    %   1) conversion from Practical to Reference Salinity (major part)
    %   2) conversion from Reference to Absolute Salinity (Absolute Anomaly, minor part)
    %

    % DIC and TA values of standard sea water
    TA_stdsw  = 2300 * SP /35;
    DIC_stdsw = 2080 * SP /35;
    
    % Absolute salinity anomaly (g/kg)
    sal_anomaly = 55.6e-6 * (TA - TA_stdsw) + 4.7e-6 * (DIC - DIC_stdsw) + 38.9e-6 * NO3 + 50.7e-6 * SIOH4;
    
    SR = SP * 35.16504 / 35;
    SA = SR + sal_anomaly;
end
