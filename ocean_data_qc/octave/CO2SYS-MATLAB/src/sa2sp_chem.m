function SP = sa2sp_chem(SA, TA, DIC, NO3, SIOH4)
% sa2sp_chem:             From Absolute to Practical Salinity
% 
% Description:
%      Convert from Absolute (SA) to Practical Salinity (SP) based on
%      Total Alkalinity, Dissolved Inorganic Carbon and Nitrate and
%      Silicate concentrations.
% 
% Usage:
%      sa2sp_chem(SA, TA, DIC, NO3, SIOH4)
%      
% Input:
%       SA: Absolute Salinity in g/kg
%       TA: Total Alkalinity, in µmol/kg
%      DIC: Dissolved Inorganic Carbone concentration in µmol/kg
%      NO3: Total Nitrate concentration in µmol/kg
%    SIOH4: Total Silicate concentration in µmol/kg
% 
% Details:
%      Convert from Absolute (SA) to Practical Salinity (SP) from carbon
%      system parameters and ion concentration which most affect water
%      density anomalies.
% 
% Output:
%       SP: Practical Salinity (in psu)
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
%      sp2sa_chem does the reverse
%      sa2sp_geo
% 
% Examples:
%         % Calculate the practical salinity of a sample with Absolute Salinity of 35 g/kg,
%         % Total Alkalinity of 0.00234 mol/kg, DIC of 0.00202 mol/kg, zero Nitrate and Silicate
%         SP = sa2sp_chem(35, 2340, 0.2020, 0, 0)
%      

    % Reverse conversion (SA from SP) follows this equation :
    %  SP = 1/r * (SA - sa_anomaly)
    %    with
    %        r = 35.16504 / 35
    %  SP = 1/r * (SA - 55.6e-6 * (TA - x*SP) - 4.7e-6 * (DIC - y*SP) - nutrients)
    %    with
    %       x  = 2300 / 35
    %       y  = 2080 / 35
    %       nutrients = 38.9e-6 * NO3 + 50.7e-6 * SIOH4
    %
    %  SP * (1 - 55.6e-6 * x/r - 4.7e-6 * y/r) = 1/r * (SA - 55.6e-6 * TA - 4.7e-6 * DIC - nutrients)
    %
    %  SP * (1 - 55.6e-6 * 2300 / 35.16504 - 4.7e-6 * 2080 / 35.16504) = ....
    %
    %  SP * 0.9960854303 = 1/r * (SA - 55.6e-6 * TA - 4.7e-6 * DIC - nutrients)
    %
    %  SP = 0.999218211671 * (SA - 55.6e-6 * TA - 4.7e-6 * DIC - nutrients)

    SP = 0.999218211671 * (SA - 55.6e-6 * TA - 4.7e-6 * DIC - 38.9e-6 * NO3 - 50.7e-6 * SIOH4);
end
