function SA = sp2sa_geo(SP, P, long, lat)
% sp2sa_geo:         From Practical to Absolute Salinity
% 
% Description:
%      Convert from Practical (SP) to Absolute Salinity (SA) based on
%      depth and geographic location.
% 
% Usage:
%      sp2sa_geo(SP, P, long, lat)
%      
% Input:
%       SP: Practical Salinity on the practical salinity scale
%        P: Sea water pressure in dbar
%     long: Longitude in decimal degrees [ 0 ... +360 ] or [ -180 ... +180 ]
%      lat: latitude in decimal degrees [-90 ... 90]
% 
% Details:
%      This subroutine is almost an alias of subroutine gsw_SA_from_SP of
%      gsw package on which it relies. The only difference is in that
%      depth and location are optional.  If location is not given, or
%      incomplete (either longitude or latitude missing), an arbitrary
%      location is chosen: the mid equatorial atlantic ocean. Note that
%      this implies an error on computed SA ranging from 0 up to 0.02
%      g/kg
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
%      T. J. McDougall, D. R. Jackett, F. J. Millero, R. Pawlowicz, 
%      and P. M. Barker, 2012: Algorithm for estimating
%      Absolute Salinity
% 
% See Also:
%      sa2sp_geo does the reverse
%      sp2sa_chem
% 
% Examples:
%         % Calculate the absolute salinity of a sample whose practical Salinity is 35,
%         % depth is 10 dbar and location is 188 degrees East and 4 degrees North.
%         SA = sp2sa_geo(35, 10, 188, 4)

    if (isempty(lat) || isempty(long))
        lat = 0; long = -25;
    end
    SA = gsw_SA_from_SP(SP,P,long,lat);
end
