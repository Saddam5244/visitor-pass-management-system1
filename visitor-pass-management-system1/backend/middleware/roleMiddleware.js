// middleware

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) =>{
        
        try {
            console.log("USER:", req.user);
            console.log("USER ROLE:", req.user.role);
            console.log("ALLOWED ROLES:", allowedRoles);
            const userRole = req.user.role;
            if(!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    message: "Access denied. You do not have permission."
                });
            }
            next();
        }catch (error){
           return res.status(500).json({
                message: "Role authorization error"
            });
        }
    };
};



module.exports = roleMiddleware;